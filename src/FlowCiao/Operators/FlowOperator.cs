﻿using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using FlowCiao.Exceptions;
using FlowCiao.Handle;
using FlowCiao.Models;
using FlowCiao.Models.Core;
using FlowCiao.Models.Execution;
using FlowCiao.Services;

namespace FlowCiao.Operators
{
    public class FlowOperator : IFlowOperator
    {
        private readonly ProcessExecutionService _processExecutionService;
        private readonly ProcessHandlerFactory _processHandlerFactory;
        private readonly IProcessService _processService;

        public FlowOperator(ProcessHandlerFactory processHandlerFactory,
            ProcessExecutionService processExecutionService,
            IProcessService processService)
        {
            _processHandlerFactory = processHandlerFactory;
            _processExecutionService = processExecutionService;
            _processService = processService;
        }

        private static ProcessStepContext InstantiateContext(int action,
            Dictionary<object, object> data,
            ProcessExecution processExecution,
            ProcessExecutionStep activeProcessStep)
        {
            return new ProcessStepContext
            {
                ProcessExecution = processExecution,
                ProcessExecutionStep = activeProcessStep,
                ProcessExecutionStepDetail = activeProcessStep.Details.Single(x => x.Transition.Actions.FirstOrDefault()!.Code == action),
                Data = data
            };
        }

        public async Task<ProcessExecution> Instantiate(Process process)
        {
            var processExecution = await _processExecutionService.InitializeProcessExecution(process);

            return processExecution;
        }
        
        public async Task<ProcessExecution> Instantiate(string flowKey)
        {
            var process = (await _processService.Get(key: flowKey))
                .SingleOrDefault();
            if (process is null)
            {
                throw new FlowCiaoException("Invalid flow key!");
            }
            
            var processExecution = await _processExecutionService.InitializeProcessExecution(process);

            return processExecution;
        }

        public async Task<ProcessResult> FireAsync(Guid processInstanceId, int action, Dictionary<object, object> data = null)
        {
            try
            {
                var processExecution = (await _processExecutionService.Get(id: processInstanceId)).SingleOrDefault();

                if (processExecution is null)
                {
                    throw new FlowCiaoException("Invalid ProcessInstance id!");
                }

                if (processExecution.ActiveExecutionStep is null)
                {
                    throw new FlowCiaoProcessExecutionException("No active steps to fire");
                }

                if (processExecution.ActiveExecutionStep.Details
                        .SingleOrDefault(x => x.Transition.Actions.FirstOrDefault()!.Code == action) is null)
                {
                    throw new FlowCiaoProcessExecutionException("Action is invalid!");
                }

                var processStepContext = InstantiateContext(action, data, processExecution, processExecution.ActiveExecutionStep);
                var handlers = _processHandlerFactory.BuildHandlers();

                var result = handlers.Peek().Handle(processStepContext);

                return result;
            }
            catch (Exception exception)
            {
                return new ProcessResult
                {
                    Status = ProcessResultStatus.Failed,
                    Message = exception.Message
                };
            }
        }

        public async Task<ProcessResult> FireAsync(ProcessExecution processExecution, int action, Dictionary<object, object> data = null)
        {
            try
            {
                await Task.CompletedTask;
                
                if (processExecution is null)
                {
                    throw new FlowCiaoException("Invalid ProcessInstance id!");
                }

                if (processExecution.ActiveExecutionStep is null)
                {
                    throw new FlowCiaoProcessExecutionException("No active steps to fire");
                }

                if (processExecution.ActiveExecutionStep.Details
                        .SingleOrDefault(x => x.Transition.Actions.FirstOrDefault()!.Code == action) is null)
                {
                    throw new FlowCiaoProcessExecutionException("Action is invalid!");
                }

                var processStepContext = InstantiateContext(action, data, processExecution, processExecution.ActiveExecutionStep);
                var handlers = _processHandlerFactory.BuildHandlers();

                var result = handlers.Peek().Handle(processStepContext);

                return result;
            }
            catch (Exception exception)
            {
                return new ProcessResult
                {
                    Status = ProcessResultStatus.Failed,
                    Message = exception.Message
                };
            }
        }

        public async Task<ProcessResult> Fire(string key,
            int action,
            Dictionary<object, object> data = null)
        {
            try
            {
                var processExecution = (await _processExecutionService.Get()).SingleOrDefault();

                if (processExecution is null)
                {
                    var process = (await _processService.Get(key: key))
                        .SingleOrDefault();
                    if (process is null)
                    {
                        throw new FlowCiaoException("Invalid flow key!");
                    }

                    processExecution = await _processExecutionService.InitializeProcessExecution(process);
                }

                if (processExecution.ActiveExecutionStep is null)
                {
                    throw new FlowCiaoProcessExecutionException("No active steps to fire");
                }

                if (processExecution.ActiveExecutionStep.Details
                        .SingleOrDefault(x => x.Transition.Actions.FirstOrDefault()!.Code == action) is null)
                {
                    throw new FlowCiaoProcessExecutionException("Action is invalid!");
                }

                var processStepContext = InstantiateContext(action, data, processExecution, processExecution.ActiveExecutionStep);
                var handlers = _processHandlerFactory.BuildHandlers();

                var result = handlers.Peek().Handle(processStepContext);

                return result;
            }
            catch (Exception exception)
            {
                return new ProcessResult
                {
                    Status = ProcessResultStatus.Failed,
                    Message = exception.Message
                };
            }
        }
        
        public async Task<State> GetFLowState(string key)
        {
            var processExecution = (await _processExecutionService.Get()).SingleOrDefault();
            if (processExecution is null)
            {
                var process = (await _processService.Get(key: key))
                        .SingleOrDefault();
                if (process is null)
                {
                    throw new FlowCiaoException("Invalid key!");
                }

                processExecution = await _processExecutionService.InitializeProcessExecution(process);
            }

            return processExecution.State;
        }
    }
}
