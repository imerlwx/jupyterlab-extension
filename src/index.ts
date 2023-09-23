import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';
import { MainAreaWidget } from '@jupyterlab/apputils';
import { ILauncher } from '@jupyterlab/launcher';
import { reactIcon } from '@jupyterlab/ui-components';
import { INotebookTracker } from '@jupyterlab/notebook';
import { DataTableWidget } from './DataTable';
import { ChatWidget } from './Chat';

/**
 * The command IDs used by the react-widget plugin.
 */
namespace CommandIDs {
  export const createDataTable = 'create-datatable-widget';
  export const createChat = 'create-chat-widget';
}

/**
 * Initialization data for the react-widget extension.
 */
const plugin: JupyterFrontEndPlugin<void> = {
  id: '@jupyterlab-examples/server-extension:plugin',
  description:
    'A minimal JupyterLab extension with backend and frontend parts.',
  autoStart: true,
  optional: [ILauncher, INotebookTracker],
  activate: (
    app: JupyterFrontEnd,
    launcher: ILauncher,
    notebookTracker: INotebookTracker
  ) => {
    const { commands } = app;
    // Create shared instances
    const sharedChatWidget = new ChatWidget(notebookTracker);

    const createDataTableCommand = CommandIDs.createDataTable;
    commands.addCommand(createDataTableCommand, {
      caption: 'Create a new Data Table Widget',
      label: 'Data Table Widget',
      icon: args => (args['isPalette'] ? undefined : reactIcon),
      execute: () => {
        // Use the shared instance when creating the DataTableWidget
        const content = new DataTableWidget(sharedChatWidget);
        const widget = new MainAreaWidget<DataTableWidget>({ content });
        widget.title.label = 'Data Table Widget';
        widget.title.icon = reactIcon;
        app.shell.add(widget, 'main');
      }
    });

    const createChatCommand = CommandIDs.createChat;
    commands.addCommand(createChatCommand, {
      caption: 'Create a new Chat Widget',
      label: 'Chat Widget',
      icon: args => (args['isPalette'] ? undefined : reactIcon),
      execute: () => {
        // Use the shared instance when creating the ChatWidget
        const widget = new MainAreaWidget<ChatWidget>({
          content: sharedChatWidget
        });
        widget.title.label = 'Chat Widget';
        widget.title.icon = reactIcon;
        app.shell.add(widget, 'main');
      }
    });

    if (launcher) {
      launcher.add({
        command: createDataTableCommand
      });
      launcher.add({
        command: createChatCommand
      });
    }
  }
};

export default plugin;
