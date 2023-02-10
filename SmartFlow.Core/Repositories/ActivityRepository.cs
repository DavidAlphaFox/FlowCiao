﻿using Dapper;
using SmartFlow.Core.Db.SqlServer;
using SmartFlow.Core.Models;
using System;
using System.Data;
using System.Data.SqlClient;
using System.Threading.Tasks;

namespace SmartFlow.Core.Repositories
{
    public class ActivityRepository
    {
        private readonly string _connectionString;

        public ActivityRepository(SmartFlowSettings settings)
        {
            _connectionString = settings.ConnectionString;
        }

        public Task<Guid> Modify(Activity entity)
        {
            return Task.Run(() =>
            {
                var toInsert = new
                {
                    Id = entity.Id == default ? Guid.NewGuid() : entity.Id,
                    Executor = entity.ProcessActivityExecutor.ToString()
                };

                using var connection = new SqlConnection(_connectionString);
                connection.Open();
                connection.Execute(ConstantsProvider.Usp_Activity_Modify, toInsert, commandType: CommandType.StoredProcedure);
                entity.Id = toInsert.Id;

                return entity.Id;
            });
        }
    }
}
