import { HTMLDocument } from "./deps/dom.ts";

/**
 * This is the heart of Lume,
 * it contains everything needed to build the site
 */
export interface Site {
  /** The site options */
  options: SiteOptions;

  /** The source handler instance */
  source: Source;

  /** The emitter instance to save pages and files */
  emitter: Emitter;

  /** The renderer instance */
  renderer: Renderer;

  /** The script runner instance */
  scripts: Scripts;

  /** The metric handler instance */
  metrics: Metrics;

  /** List of pages generated by the build */
  pages: Page[];

  /** Return the src path */
  src(...path: string[]): string;

  /** Return the dest path */
  dest(...path: string[]): string;

  /** Add an event */
  addEventListener(
    type: EventType,
    listener: EventListener | string,
    options?: EventOptions,
  ): this;

  /** Dispatch an event */
  dispatchEvent(event: Event): Promise<boolean>;

  /** Use a plugin */
  use(plugin: Plugin): this;

  /** Register a script */
  script(name: string, ...scripts: Command[]): this;

  /** Register a data loader for some extensions */
  loadData(extensions: string[], loader: Loader): this;

  /** Register a page loader for some extensions */
  loadPages(extensions: string[], loader?: Loader, engine?: Engine): this;

  /** Register an assets loader for some extensions */
  loadAssets(extensions: string[], loader?: Loader): this;

  /** Register a preprocessor for some extensions */
  preprocess(extensions: string[], preprocessor: Processor): this;

  /** Register a processor for some extensions */
  process(extensions: string[], processor: Processor): this;

  /** Register a template filter */
  filter(name: string, filter: Helper, async?: boolean): this;

  /** Register a template helper */
  helper(name: string, fn: Helper, options: HelperOptions): this;

  /** Register extra data accessible by layouts */
  data(name: string, data: unknown): this;

  /** Copy static files or directories without processing */
  copy(from: string, to?: string): this;

  /** Ignore one or several files or directories */
  ignore(...paths: string[]): this;

  /** Define independent scopes to optimize the update process */
  scopedUpdates(...scopes: ScopeFilter[]): this;

  /** Clear the dest directory */
  clear(): Promise<void>;

  /** Build the entire site */
  build(): Promise<void>;

  /** Render a single page (used for on demand rendering) */
  renderPage(file: string): Promise<Page | undefined>;

  /** Reload some files that might be changed */
  update(files: Set<string>): Promise<void>;

  /** Run a script */
  run(name: string, options?: CommandOptions): Promise<boolean>;

  /** Return the URL of a page */
  url(path: string, absolute?: boolean): string;
}

export type ScopeFilter = (path: string) => boolean;

/** The options to configure the site build */
export interface SiteOptions {
  /** The path of the current working directory */
  cwd: string;

  /** The path of the site source */
  src: string;

  /** The path of the built destination */
  dest: string;

  /** The default includes path */
  includes: string;

  /** Set `true` to enable the `dev` mode */
  dev: boolean;

  /** The site location (used to generate final urls) */
  location: URL;

  /** Set true to collect metrics and measure the build performance */
  metrics: boolean;

  /** Set true to generate pretty urls (`/about-me/`) */
  prettyUrls: boolean;

  /** Set `true` to skip logs */
  quiet: boolean;

  /** The local server options */
  server: ServerOptions;

  /** The local watcher options */
  watcher: WatcherOptions;
}

/** The options to configure the local server */
export interface ServerOptions {
  /** The port to listen on */
  port: number;

  /** To open the server in a browser */
  open: boolean;

  /** The file to serve on 404 error */
  page404: string;

  /** Optional request handler for pages served on demand */
  router?: (url: URL) => Promise<FileResponse | undefined>;
}

/** Data to create a new response. */
export type FileResponse = [BodyInit | null, ResponseInit];

/** The options to configure the local watcher */
export interface WatcherOptions {
  /** Files or folders to ignore by the watcher */
  ignore: string[];

  /** The interval in milliseconds to check for changes */
  debounce: number;
}

/**
 * This is the class to load the source files
 */
export interface Source {
  /** List of files and folders to copy */
  staticFiles: Map<string, string>;

  /** Returns all pages found in the source */
  pages: Iterable<Page>;

  /** Load all sources */
  load(): Promise<void>;

  /** Reload a file */
  reload(file: string): Promise<void>;

  /** Register a data loader for some extensions */
  addDataLoader(extensions: string[], loader: Loader): void;

  /** Register a page loader for some extensions */
  addPageLoader(extensions: string[], loader: Loader, isAsset: boolean): void;

  /** Register a static file/folder that must be copied */
  addStaticFile(from: string, to: string): void;

  /** Register a path to ignore */
  addIgnoredPath(path: string): void;

  /** Return the File or Directory of a path */
  getFileOrDirectory(path: string): Directory | Page | undefined;

  /** Returns the loader of a path */
  getPageLoader(path: string): [ext: string, loader: Loader] | undefined;

  /** Read a file using a loader */
  readFile(path: string, loader: Loader): Promise<Data>;
}

/**
 * Class to output the generated site to the dest folder
 */
export interface Emitter {
  /** Save a page in the dest folder */
  savePage(page: Page): Promise<void>;

  /** Copy a static file in the dest folder */
  copyFile(from: string, to: string): Promise<void>;

  /** Empty the dest folder */
  clear(): Promise<void>;
}

/**
 * Class to manage the template engines, processors
 * and render the pages
 */
export interface Renderer {
  /** Register a template engine for some extensions */
  addEngine(extensions: string[], engine: Engine): void;

  /** Register a preprocessor for some extensions */
  addPreprocessor(extensions: string[], preprocessor: Processor): void;

  /** Register a processor for some extensions */
  addProcessor(extensions: string[], processor: Processor): void;

  /** Configure a includes folder for some extensions */
  addInclude(extensions: string[], path: string): void;

  /** Register a template helper */
  addHelper(name: string, fn: Helper, options: HelperOptions): void;

  /** Add global data accesible by the layouts */
  addData(name: string, data: unknown): void;

  /** Render the pages */
  renderPages(pages: Iterable<Page>): Promise<void>;

  /** Render a page on demand */
  renderPageOnDemand(page: Page): Promise<void>;
}

/** Script runner to store and run commands */
export interface Scripts {
  /** Register a new command */
  add(name: string, ...commands: Command[]): void;

  /** Run one or more commands */
  run(options: CommandOptions, ...names: Command[]): Promise<boolean>;
}

/** A command executed by a script */
export type Command = string | ((site: Site) => unknown) | Command[];

/** The options for a Command */
export type CommandOptions = Omit<Deno.RunOptions, "cmd">;

/** Class to measure and collect metrics */
export interface Metrics {
  /** Start measuring */
  start(name: string, details?: MetricDetail): Metric;

  /** Print the metrics in the console */
  print(): void;

  /** Save the metrics data in a file */
  save(file: string): Promise<void>;
}

/** A single metric */
export interface Metric {
  /** The metric name */
  name: string;

  /** Additional info of the metric */
  details?: MetricDetail;

  /** Stop measuring */
  stop(): void;
}

/** The details associated to a metric */
export interface MetricDetail {
  /** Page related with this metric */
  page?: Page;

  [key: string]: unknown;
}

/** An event object */
export interface Event {
  /** The event type */
  type: EventType;

  /**
   * Available only in "beforeUpdate" and "afterUpdate"
   * contains the files that were changed
   */
  files?: Set<string>;

  /**
   * Available only in "beforeRenderOnDemand"
   * contains the page that will be rendered
   */
  page?: Page;
}

/** The available event types */
export type EventType =
  | "beforeBuild"
  | "afterBuild"
  | "beforeUpdate"
  | "afterUpdate"
  | "afterRender"
  | "beforeRenderOnDemand"
  | "beforeSave";

/** Event listeners */
export type EventListener = (event: Event) => unknown;
export interface EventOptions {
  once?: boolean;
  signal?: AbortSignal;
}

/** A page */
export interface Page {
  /** The directory this page is in */
  parent?: Directory;

  /** The src info of this page */
  src: Src;

  /** The destination of the page */
  dest: Dest;

  /** The associated merged data */
  data: Data;

  /** Internal data, used by plugins, processors, etc to save arbitrary values */
  _data: Record<string, unknown>;

  /** The content of this page */
  content?: Content;

  /** The parsed HTML code from the content */
  document?: HTMLDocument;

  /** Duplicate this page. Optionally, you can provide new data */
  duplicate(data?: Data): Page;

  /** Refresh the cached merged data (used for rebuild) */
  refreshCache(): void;

  /** Merge more data with the existing */
  addData(data: Data): void;
}

/** The .src property for a Page or Directory */
export interface Src {
  /** The path to the file (without extension) */
  path: string;

  /** The extension of the file (undefined for folders) */
  ext?: string;

  /** The last modified time */
  lastModified?: Date;

  /** The creation time */
  created?: Date;
}

/** The .dest property for a Page */
export interface Dest {
  /** The path to the file (without extension) */
  path: string;

  /** The extension of the file */
  ext: string;

  /** The hash (used to detect content changes) */
  hash?: string;
}

/** The .content property for a Page */
export type Content = Uint8Array | string;

/** The data of a page */
export interface Data {
  /** List of tags assigned to a page or folder */
  tags?: string[];

  /** The url of a page */
  url?: string | ((page: Page) => string);

  /** If is `true`, the page will be visible only in `dev` mode */
  draft?: boolean;

  /** The date creation of the page */
  date?: Date;

  /** To configure the render order of a page */
  renderOrder?: number;

  /** The content of a page */
  content?: unknown;

  /** The layout used to render a page */
  layout?: string;

  /** To configure a different template engine(s) to render a page */
  templateEngine?: string | string[];

  /** Whether render this page on demand or not */
  ondemand?: boolean;

  [index: string]: unknown;
}

/** A directory */
export interface Directory {
  /** The parent directory */
  parent?: Directory;

  /** The src info of this directory */
  src: Src;

  /** The associated merged data */
  data: Data;

  /** The list of pages included in this directory */
  pages: Map<string, Page>;

  /** The list os subdirectories */
  dirs: Map<string, Directory>;

  /** Create a subdirectory and return it */
  createDirectory(name: string): Directory;

  /** Add a page to this directory */
  setPage(name: string, page: Page): void;

  /** Remove a page from this directory */
  unsetPage(name: string): void;

  /** Return the list of pages in this directory recursively */
  getPages(): Iterable<Page>;

  /** Refresh the data cache in this directory recursively (used for rebuild) */
  refreshCache(): void;

  /** Merge more data with the existing */
  addData(data: Data): void;
}

/** A function that loads and returns the file content */
export type Loader = (path: string) => Promise<Data>;

/** A (pre)processor */
export type Processor = (page: Page, site: Site) => void;

/** The method that installs a plugin */
export type PluginSetup = ((options: unknown) => Plugin);

/** A generic Lume plugin */
export type Plugin = (site: Site) => void;

/** An interface used by all template engines */
export interface Engine {
  /** Render a template */
  render(
    content: unknown,
    data: Data,
    filename: string,
  ): unknown | Promise<unknown>;

  /** Add a helper to the template engine */
  addHelper(
    name: string,
    fn: Helper,
    options: HelperOptions,
  ): void;
}

/** A generic helper to be used in template engines */
export type Helper = (...args: any[]) => any;

/** The options for a template helper */
export interface HelperOptions {
  /** The type of the helper (tag, filter, etc) */
  type: string;

  /** Whether the helper returns an instance or not */
  async?: boolean;

  /** Whether the helper has a body or not (used for tag types) */
  body?: boolean;
}
