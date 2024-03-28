﻿namespace FlowCiao.Models.Flow;

public class ActivityAssembly
{
    public ActivityAssembly(string fileName, byte[] fileContent)
    {
        FileName = fileName;
        FileContent = fileContent;
    }
    
    public string FileName { get; }
    public byte[] FileContent { get; }
}