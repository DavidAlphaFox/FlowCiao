using System;
using System.Collections.Generic;
using System.Linq;
using FlowCiao.Interfaces;
using FlowCiao.Models.Builder.Serialized;
using FlowCiao.Models.Core;
using FlowCiao.Services;
using FlowCiao.Utils;

namespace FlowCiao.Builder.Serialization;

internal class SerializerFlowPlanner : IFlowPlanner
{
    private readonly SerializedFlow _serializedFlow;
    private readonly ActivityService _activityService;
    public string Key { get; set; }

    public SerializerFlowPlanner(SerializedFlow serializedFlow, ActivityService activityService)
    {
        _serializedFlow = serializedFlow;
        _activityService = activityService;
        Key = _serializedFlow.Key;
    }
    
    public IFlowBuilder Plan(IFlowBuilder builder)
    {
        var states = _serializedFlow.States
            .Select(state => new State(state.Code, state.Name))
            .ToList();

        builder.Initial(CreateStepBuilder(_serializedFlow.Initial, states));

        if (_serializedFlow.Steps.IsNullOrEmpty())
        {
            return builder;
        }

        _serializedFlow.Steps.ForEach(step => { builder.NewStep(CreateStepBuilder(step, states)); });

        return builder;
    }
    
    private Action<IFlowStepBuilder> CreateStepBuilder(SerializedStep serializedStep, IReadOnlyCollection<State> states)
    {
        return stepBuilder =>
        {
            var fromState = states.Single(state => state.Code == serializedStep.FromStateCode);
            var allowedList = states
                .Where(state => serializedStep.Allows.Exists(allowed => allowed.AllowedStateCode == state.Code))
                .Select(state => new
                {
                    AllowedState = state,
                    AllowedTrigger = serializedStep.Allows.Single(x => x.AllowedStateCode == state.Code).TriggerCode
                })
                .ToList();

            stepBuilder.For(fromState);
            if (!allowedList.IsNullOrEmpty())
            {
                allowedList.ForEach(allowed => { stepBuilder.Allow(allowed.AllowedState, allowed.AllowedTrigger); });
            }

            if (!string.IsNullOrWhiteSpace(serializedStep.OnEntry?.ActorName))
            {
                CreateActivity(stepBuilder, serializedStep.OnEntry);
            }

            if (!string.IsNullOrWhiteSpace(serializedStep.OnExit?.ActorName))
            {
                CreateActivity(stepBuilder, serializedStep.OnExit);
            }
        };
    }
    
    private void CreateActivity(IFlowStepBuilder stepBuilder, SerializedActivity serializedActivity)
    {
        var flowActivity = TryGetActivity(serializedActivity.ActorName);
        var methodInfo = typeof(IFlowStepBuilder).GetMethod(nameof(IFlowStepBuilder.OnEntry));
        var genericMethod = methodInfo!.MakeGenericMethod(flowActivity.GetType());
        genericMethod.Invoke(stepBuilder, null);
    }
    
    private IFlowActivity TryGetActivity(string activityName)
    {
        try
        {
            IFlowActivity flowActivity;

            var activityType = GeneralUtils.FindType(activityName, typeof(IFlowActivity));
            if (activityType != null)
            {
                flowActivity = (IFlowActivity)Activator.CreateInstance(activityType);
            }
            else
            {
                var storedActivity = _activityService.LoadActivity(activityName).GetAwaiter().GetResult();
                flowActivity = storedActivity;
            }

            return flowActivity;
        }
        catch (Exception)
        {
            return null;
        }
    }
}
