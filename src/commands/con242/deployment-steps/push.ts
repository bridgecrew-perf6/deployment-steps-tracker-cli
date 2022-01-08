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
import { ParsedStep } from '../../../interfaces/deployment-step';

// Initialize Messages with the current plugin directory
Messages.importMessagesDirectory(__dirname);

// Load the specific messages for this file. Messages from @salesforce/command, @salesforce/core,
// or any library that is using the messages framework can also be loaded this way.
const messages = Messages.loadMessages('deployment-steps-tracker-cli', 'push');

export default class Push extends SfdxCommand {
  public static description = messages.getMessage('commandDescription');
  public static examples = messages.getMessage('examples').split(os.EOL);

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

    // this.org is guaranteed because requiresUsername=true, as opposed to supportsUsername
    const conn = this.org.getConnection();
    const query = 'Select Name, TrialExpirationDate from Organization';
    // The type we are querying for
    interface Organization {
      Name: string;
      TrialExpirationDate: string;
    }

    // Query the org
    const result = await conn.query<Organization>(query);

    if (!result.records || result.records.length <= 0) {
      throw new SfdxError(messages.getMessage('errorNoOrgResults', [this.org.getOrgId()]));
    }

    let deploymentSteps: ParsedStep[] = await parseFiles(dir);

    // filter by type flag
    if (type !== '') {
      deploymentSteps = deploymentSteps.filter((step) => type.split(',').includes(step.type));
    }

    // eslint-disable-next-line no-console
    console.log(deploymentSteps);

    this.ux.log('hi there, command is awesome!');

    // this.hubOrg is NOT guaranteed because supportsHubOrgUsername=true, as opposed to requiresHubOrgUsername.
    if (this.hubOrg) {
      const hubOrgId = this.hubOrg.getOrgId();
      this.ux.log(`My hub org id is: ${hubOrgId}`);
    }

    /* if (this.flags.force && this.args.file) {
      this.ux.log(`You input --force and a file: ${this.args.file as string}`);
    }*/

    // Return an object to be displayed with --json
    return { orgId: this.org.getOrgId() };
  }
}
