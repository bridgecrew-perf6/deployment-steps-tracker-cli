export interface RawStepFile {
  reference: string;
  author?: string;
  release?: string;
  steps: { [key: string]: RawStep };
}

export interface RawStep {
  title?: string;
  description?: string;
  type?: string;
  resetAfterSandboxRefresh?: boolean;
  resetOnInstallOfPackage?: string[];
  contentType?: string;
  content?: string;
}

export interface ParsedStep {
  reference: string;
  author?: string;
  release?: string;
  title?: string;
  description?: string;
  type?: string;
  resetAfterSandboxRefresh?: boolean;
  resetOnInstallOfPackage?: string[];
  contentType?: string;
  content?: string;
}
