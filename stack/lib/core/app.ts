import * as cdktf from "cdktf";
import * as fs from "fs";

/*
EXPERIMENT

Using context-semantic, instead of directly using environment variables
or "classical" terraform variables, seems to be the way to go - alas AWS
is going down that route.

In order to provide stage-related or sensitive configuration during build,
without having to persist them in version control the following extensions
to the App class allow to inject additional context (i.e. in addition to the
`cdktf.json` file, that will live in VCS) multiple environment variables are
introduced:

1. `CDKTF_RUNTIME_CONTEXT`: same as `CDKTF_CONTEXT_JSON`, however that is 
    already being (mis?)used, overridden during `cdktf.json` parsing
    see: https://github.com/hashicorp/terraform-cdk/blob/2d58c1256b6e58ce9d89fefc0b8f961e8073b21d/packages/%40cdktf/provider-generator/lib/config.ts
2. `CDKTF_RUNTIME_CONTEXT_FILE`: takes a local path to a JSON file that
    contains context (and is intended not to be stored in VCS)
3. `CDKTF_CONTEXT_` is not a "stand-alone", but a prefix for any context
    value, like `TF_VAR_` was used with in Terraform HCL

The various options are inteded to be experimented with, to understand which
make sense and which can be dropped.
*/

const RUNTIME_CONTEXT_ENV = "CDKTF_RUNTIME_CONTEXT";
const RUNTIME_CONTEXT_ENV_PREFIX = "CDKTF_CONTEXT_";
const RUNTIME_CONTEXT_FILE_ENV = "CDKTF_RUNTIME_CONTEXT_FILE";

const loadEnvContext = (): Object =>
  RUNTIME_CONTEXT_ENV in process.env && process.env[RUNTIME_CONTEXT_ENV]
    ? JSON.parse(process.env[RUNTIME_CONTEXT_ENV] as string)
    : {};

const loadPrefixedEnvContext = (): Object =>
  Object.fromEntries(
    Object.entries(process.env)
      .filter(([key]) => key.startsWith(RUNTIME_CONTEXT_ENV_PREFIX))
      .map(([key, value]) => [
        key.substr(RUNTIME_CONTEXT_ENV_PREFIX.length),
        value,
      ])
  );

const loadFileContext = (): Object =>
  RUNTIME_CONTEXT_FILE_ENV in process.env &&
  process.env[RUNTIME_CONTEXT_FILE_ENV]
    ? JSON.parse(
        fs.readFileSync(process.env[RUNTIME_CONTEXT_FILE_ENV] as string, "utf8")
      )
    : {};

export class App extends cdktf.App {
  /**
   * Constructor is modified to pass over any option, but loads context so
   * that the following order of override is adhered to (topmost has highest
   * priority):
   * - context in env (CDKTF_CONTEXT_ prefixed)
   * - context in env (CDKTF_RUNTIME_CONTEXT JSON encoded)
   * - context in file (CDKTF_RUNTIME_CONTEXT_FILE JSON encoded)
   * - context provided in constructor
   */
  constructor(options?: cdktf.AppOptions) {
    super({
      ...options,
      context: {
        ...options?.context,
        ...loadFileContext(),
        ...loadEnvContext(),
        ...loadPrefixedEnvContext(),
      },
    });
  }

  /**
   * Convenient accessor to parameters in context
   *
   * @param key in the context
   * @param fallback optional value to use, if context not existing
   * @returns value from context or fallback
   */
  public context = (key: string, fallback?: string): string | undefined =>
    this.node.tryGetContext(key) ?? fallback;

  /**
   * Convenient accessor to parameters in context
   *
   * @param key in the context
   * @param fallback optional value to use, if context not existing
   * @returns value from context or fallback or throws exception
   */
  public mustContext = (key: string, fallback?: string): string => {
    const val = this.context(key, fallback);
    if (val !== undefined) return val as string;
    throw new Error(`Missing required context key: ${key}`);
  };
}
