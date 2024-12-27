import { App } from "obsidian";

/**
 * A static store that holds the global Obsidian App instance.
 * This allows any module to access the App instance without prop drilling.
 */
export class AppStore {
    private static instance: App;

    /**
     * Sets the global App instance
     * @param app The Obsidian App instance
     */
    static setApp(app: App) {
        AppStore.instance = app;
    }

    /**
     * Gets the global App instance
     * @returns The Obsidian App instance
     * @throws Error if the App instance hasn't been set
     */
    static getApp(): App {
        if (!AppStore.instance) {
            throw new Error('App instance not set. Ensure setApp is called during plugin initialization.');
        }
        return AppStore.instance;
    }
}
