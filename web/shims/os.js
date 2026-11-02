// node:os – the data folder of the web version lives under this made-up home folder (in the browser's storage).
export const homedir = () => '/home/web';
export const tmpdir = () => '/tmp';
export const platform = () => 'web';
export const EOL = '\n';
export default { homedir, tmpdir, platform, EOL };
