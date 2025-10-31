import { NextResponse } from 'next/server';
import { CV_GRAPH } from '../../../data/cv-graph';

// DynamoDB loader (optional)
async function loadFromDynamoDB() {
  try {
    const { DynamoDBClient } = await import('@aws-sdk/client-dynamodb');
    const { DynamoDBDocumentClient, ScanCommand } = await import('@aws-sdk/lib-dynamodb');
    
    const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' });
    const docClient = DynamoDBDocumentClient.from(client);
    
    const [nodesResult, linksResult] = await Promise.all([
      docClient.send(new ScanCommand({ TableName: process.env.CV_NODES_TABLE || 'cv-nodes' })),
      docClient.send(new ScanCommand({ TableName: process.env.CV_LINKS_TABLE || 'cv-links' }))
    ]);
    
    return {
      nodes: nodesResult.Items || [],
      links: linksResult.Items || []
    };
  } catch (error) {
    console.error('DynamoDB load failed:', error);
    throw error;
  }
}

export async function GET() {
  try {
    const dataSource = process.env.CV_DATA_SOURCE || 'file';
    
    if (dataSource === 'dynamodb') {
      const cvGraph = await loadFromDynamoDB();
      return NextResponse.json(cvGraph);
    }
    
    // Default to file-based data
    return NextResponse.json(CV_GRAPH);
  } catch (error) {
    console.error('CV Graph API error:', error);
    return NextResponse.json(CV_GRAPH); // Fallback to file data
  }
}