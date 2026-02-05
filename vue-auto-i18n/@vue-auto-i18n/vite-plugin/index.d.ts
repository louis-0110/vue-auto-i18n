import { Plugin } from 'vite';

/**
 * @vue-auto-i18n/vite-plugin
 * Vite plugin for automatic i18n transformation
 */

interface PluginOptions {
    localesDir?: string;
    cacheDir?: string;
    devMode?: boolean;
    injectI18n?: boolean;
    transformMode?: 'replace' | 'inject';
}
/**
 * Create Vite Auto I18n Plugin
 */
declare function createAutoI18nPlugin(options?: PluginOptions): Plugin;

export { type PluginOptions, createAutoI18nPlugin, createAutoI18nPlugin as default };
