/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import * as os from 'os';
import { flags, SfdxCommand } from '@salesforce/command';
import { Messages, SfdxError } from '@salesforce/core';
import { AnyJson } from '@salesforce/ts-types';
import parseFiles from '../../../util/deployment-steps/parse-files';
import { DeploymentFromOrg, DeploymentResponse, ParsedStep } from '../../../interfaces/deployment-step';
import queryDeploymentFromOrg from '../../../util/deployment-steps/query-deployment-steps';

// Initialize Messages with the current plugin directory
Messages.importMessagesDirectory(__dirname);

// Load the specific messages for this file. Messages from @salesforce/command, @salesforce/core,
// or any library that is using the messages framework can also be loaded this way.
const messages = Messages.loadMessages('deployment-steps-tracker-cli', 'push');

export default class Push extends SfdxCommand {
  public static description = messages.getMessage('commandDescription');
  public static examples = messages.getMessage('examples').split(os.EOL);

  // define command flags
  protected static flagsConfig = {
    sourcedir: flags.string({
      char: 'd',
      description: messages.getMessage('sourceDirFlagDescription'),
    }),
    type: flags.string({
      char: 't',
      description: messages.getMessage('typeFlagDescription'),
    }),
  };

  protected static requiresUsername = true;

  public async run(): Promise<AnyJson> {
    const dir = (this.flags.sourcedir || '') as string;
    const type = (this.flags.type || '') as string;

    const conn = this.org.getConnection();

    // get deployment steps from files
    let deploymentSteps: ParsedStep[] = await parseFiles(dir);

    // filter by type flag
    if (type !== '') {
      deploymentSteps = deploymentSteps.filter((step) => type.split(',').includes(step.type));
    }
    // get relevant deployment steps from org
    let queryResults: DeploymentFromOrg[] = [];
    if (deploymentSteps) {
      queryResults = await queryDeploymentFromOrg(deploymentSteps, conn);
    }
    // calculate difference to push to org
    let stepsToInsert: ParsedStep[] = [];
    deploymentSteps.forEach((step) => {
      if (!queryResults.some((queryItem) => queryItem.Name === step.reference)) {
        stepsToInsert = [...stepsToInsert, step];
      }
    });
    // eslint-disable-next-line no-console
    console.log('updating following data...');
    // eslint-disable-next-line no-console
    console.table(stepsToInsert, ['reference', 'title', 'type']);

    return { orgId: this.org.getOrgId() };
  }
}
