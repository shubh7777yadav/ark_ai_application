import { WebContainer } from '@webcontainer/api';

let webContainerInstance = null;

export const getWebContainer = async () => {
    try {
        if (webContainerInstance === null) {
            console.log('Initializing WebContainer...');
            webContainerInstance = await WebContainer.boot();
            console.log('WebContainer initialized successfully');
        }
        return webContainerInstance;
    } catch (error) {
        console.error('Failed to initialize WebContainer:', error);
        throw error;
    }
}

export const initializeFileSystem = async (webContainer, fileTree) => {
    try {
        if (!webContainer) {
            throw new Error('WebContainer not initialized');
        }

        // Convert fileTree to the format expected by WebContainer
        const files = {};
        Object.keys(fileTree).forEach(fileName => {
            if (fileTree[fileName] && fileTree[fileName].file && fileTree[fileName].file.contents) {
                files[fileName] = {
                    file: {
                        contents: fileTree[fileName].file.contents
                    }
                };
            }
        });

        console.log('Mounting files to WebContainer:', files);
        await webContainer.mount(files);
        console.log('Files mounted successfully');
        
        return true;
    } catch (error) {
        console.error('Failed to initialize file system:', error);
        throw error;
    }
}