import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';
import { MainAreaWidget } from '@jupyterlab/apputils';
import { ILauncher } from '@jupyterlab/launcher';
import { LabIcon } from '@jupyterlab/ui-components';
import { INotebookTracker } from '@jupyterlab/notebook';
import { ChatWidget } from './Chat';

/**
 * Tutorly launcher icon (a graduation cap). Defined inline as an SVG string so
 * it needs no webpack svg-loader configuration. Uses the app's blue accent.
 */
const tutorlyIconSvg = `
<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M12 3 1 9l11 6 11-6-11-6z" fill="#0969da"/>
  <path d="M5 12.2V16c0 .4.2.7.5.9C7 17.7 9.4 19 12 19s5-1.3 6.5-2.1c.3-.2.5-.5.5-.9v-3.8l-7 3.8-7-3.8z" fill="#2a7de1"/>
  <path d="M21 9v5.5" stroke="#0969da" stroke-width="1.4" stroke-linecap="round"/>
</svg>
`;

const tutorlyIcon = new LabIcon({
  name: 'tutorly:icon',
  svgstr: tutorlyIconSvg
});

/**
 * The command IDs used by the react-widget plugin.
 */
namespace CommandIDs {
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
    // Create shared instance
    const sharedChatWidget = new ChatWidget(notebookTracker);

    const createChatCommand = CommandIDs.createChat;
    commands.addCommand(createChatCommand, {
      caption: 'Open Tutorly',
      label: 'Tutorly',
      icon: args => (args['isPalette'] ? undefined : tutorlyIcon),
      execute: () => {
        // Use the shared instance when creating the ChatWidget
        const widget = new MainAreaWidget<ChatWidget>({
          content: sharedChatWidget
        });
        widget.title.label = 'Tutorly';
        widget.title.icon = tutorlyIcon;
        app.shell.add(widget, 'main');
      }
    });

    if (launcher) {
      launcher.add({
        command: createChatCommand
      });
    }
  }
};

export default plugin;
