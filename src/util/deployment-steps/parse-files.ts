import * as fs from 'fs/promises';
import * as path from 'path';
import * as YAML from 'yaml';
import { ParsedStep, RawStepFile } from '../../interfaces/deployment-step';

export default async function parseFiles(dir: string): Promise<ParsedStep[]> {
  const paths = await getAllFileNames(dir);
  const parsedFiles = await readAllAsJson(paths);
  const parsedSteps: ParsedStep[] = convertFilesToSteps(parsedFiles);
  return parsedSteps;
}

// get all file names from dir
export async function getAllFileNames(dirPath: string, arrayOfFiles?: string[]): Promise<string[]> {
  const files = await fs.readdir(dirPath);
  arrayOfFiles = arrayOfFiles || [];

  for (const file of files) {
    const stat = await fs.stat(dirPath + '/' + file);
    if (stat.isDirectory()) {
      arrayOfFiles = await getAllFileNames(dirPath + '/' + file, arrayOfFiles);
    } else {
      if (arrayOfFiles) {
        arrayOfFiles.push(path.join(__dirname, dirPath, '/', file));
      }
    }
  }
  return arrayOfFiles;
}

// read all yml files in folder as json
export async function readAllAsJson(paths: string[]): Promise<RawStepFile[]> {
  const EXTENSION = '.yml';
  const filepaths = paths.filter((file) => {
    return path.extname(file).toLowerCase() === EXTENSION;
  });

  let parsedRawFiles: RawStepFile[] = [];
  // read each file and convert to json
  for (const filepath of filepaths) {
    const relativePath = filepath.replace(__dirname, '.');
    const raw = await fs.readFile(relativePath, 'utf8');
    const parsedFile: RawStepFile = YAML.parse(raw) as RawStepFile;
    parsedRawFiles = [...parsedRawFiles, parsedFile];
  }
  return parsedRawFiles;
}

// convert raw file content in target json format
export function convertFilesToSteps(parsedFiles: RawStepFile[]): ParsedStep[] {
  let parsedSteps: ParsedStep[] = [];

  // for each file
  for (const rawStep of parsedFiles) {
    // for each step in file
    for (const prop in rawStep.steps) {
      if (!isNaN(Number(prop))) {
        const parsedStep: ParsedStep = {
          author: rawStep?.author,
          reference: rawStep.reference + '_' + prop,
          content: rawStep.steps[prop]?.content,
          contentType: rawStep.steps[prop]?.contentType,
          description: rawStep.steps[prop]?.contentType,
          release: rawStep?.release,
          resetAfterSandboxRefresh: rawStep.steps[prop]?.resetAfterSandboxRefresh,
          resetOnInstallOfPackage: rawStep.steps[prop]?.resetOnInstallOfPackage,
          type: rawStep.steps[prop]?.type,
          title: rawStep.steps[prop]?.title,
        };
        parsedSteps = [...parsedSteps, parsedStep];
      }
    }
  }
  return parsedSteps.sort((a, b) => (a.reference > b.reference ? 1 : -1));
}
