import { Connection } from '@salesforce/core';
import { DeploymentFromOrg, ParsedStep } from '../../interfaces/deployment-step';
const chunksize = 1000;

export default async function queryDeploymentFromOrg(
  deploymentSteps: ParsedStep[],
  conn: Connection
): Promise<DeploymentFromOrg[]> {
  const referenceStrings = deploymentSteps.map(function (item) {
    return item.reference;
  });
  const chunks: string[][] = sliceIntoChunks(referenceStrings, chunksize);

  let queryResults: DeploymentFromOrg[] = [];

  for (const chunk of chunks) {
    const filterItems: string[] = chunk.map((step) => {
      return "'" + step + "'";
    });
    const query = `SELECT id, Name, Execution_required__c FROM Deployment_Step__c  WHERE name in (${filterItems.join(
      ','
    )})`;
    // Query the org
    const result = await conn.query<DeploymentFromOrg>(query);

    if (result?.done) {
      queryResults = [...queryResults, ...result.records];
    }
  }
  return queryResults;
}

// bulkify string array
function sliceIntoChunks(arr: string[], chunkSize: number): string[][] {
  let res: string[][] = [];
  for (let i = 0; i < arr.length; i += chunkSize) {
    const chunk = arr.slice(i, i + chunkSize);
    res = [...res, chunk];
  }
  return res;
}
