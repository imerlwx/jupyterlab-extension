import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';
import { MainAreaWidget } from '@jupyterlab/apputils';
import { ILauncher } from '@jupyterlab/launcher';
import { reactIcon } from '@jupyterlab/ui-components';
import { INotebookTracker } from '@jupyterlab/notebook';
import { VideoSegmentWidget } from './VideoSegment';
import { VideoPlayerWidget } from './VideoPlayer';
import { DataTableWidget } from './DataTable';
import { ConversationWidget } from './Conversation';

/**
 * The command IDs used by the react-widget plugin.
 */
namespace CommandIDs {
  export const createVideoSegment = 'create-video-segment-widget';
  export const createVideo = 'create-video-widget';
  export const createDataTable = 'create-datatable-widget';
  export const createConversation = 'create-conversation-widget';
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
    // palette: ICommandPalette, , ICommandPalette, ITranslator
    // translator: ITranslator
  ) => {
    const { commands } = app;
    // const trans = translator.load('jupyterlab');

    // Create shared instances
    const sharedVideoSegmentWidget = new VideoSegmentWidget();
    const sharedVideoPlayerWidget = new VideoPlayerWidget(
      sharedVideoSegmentWidget
    );
    const sharedConversationWidget = new ConversationWidget(
      sharedVideoPlayerWidget,
      sharedVideoSegmentWidget,
      notebookTracker
    );

    const createVideoSegmentCommand = CommandIDs.createVideoSegment;
    commands.addCommand(createVideoSegmentCommand, {
      caption: 'Create a new Video Segment Widget',
      label: 'Video Segment Widget',
      icon: args => (args['isPalette'] ? undefined : reactIcon),
      execute: () => {
        // Use the shared instance when creating the MainAreaWidget
        const widget = new MainAreaWidget<VideoSegmentWidget>({
          content: sharedVideoSegmentWidget
        });
        widget.title.label = 'Video Segment Widget';
        widget.title.icon = reactIcon;
        app.shell.add(widget, 'main');
      }
    });

    const createVideoCommand = CommandIDs.createVideo;
    commands.addCommand(createVideoCommand, {
      caption: 'Create a new Video Widget',
      label: 'Video Widget',
      icon: args => (args['isPalette'] ? undefined : reactIcon),
      execute: () => {
        // Use the shared instance when creating the VideoPlayerWidget
        const widget = new MainAreaWidget<VideoPlayerWidget>({
          content: sharedVideoPlayerWidget
        });
        widget.title.label = 'Video Widget';
        widget.title.icon = reactIcon;
        app.shell.add(widget, 'main');
      }
    });

    const createDataTableCommand = CommandIDs.createDataTable;
    commands.addCommand(createDataTableCommand, {
      caption: 'Create a new Data Table Widget',
      label: 'Data Table Widget',
      icon: args => (args['isPalette'] ? undefined : reactIcon),
      execute: () => {
        // You should pass the url of the CSV file
        const content = new DataTableWidget(sharedVideoSegmentWidget);
        const widget = new MainAreaWidget<DataTableWidget>({ content });
        widget.title.label = 'Data Table Widget';
        widget.title.icon = reactIcon;
        app.shell.add(widget, 'main');
      }
    });

    const createConversationCommand = CommandIDs.createConversation;
    commands.addCommand(createConversationCommand, {
      caption: 'Create a new Conversation Widget',
      label: 'Conversation Widget',
      icon: args => (args['isPalette'] ? undefined : reactIcon),
      execute: () => {
        // You should pass the url of the CSV file
        const widget = new MainAreaWidget<ConversationWidget>({
          content: sharedConversationWidget
        });
        widget.title.label = 'Conversation Widget';
        widget.title.icon = reactIcon;
        app.shell.add(widget, 'main');
      }
    });

    if (launcher) {
      launcher.add({
        command: createVideoSegmentCommand
      });
      launcher.add({
        command: createVideoCommand
      });
      launcher.add({
        command: createDataTableCommand
      });
      launcher.add({
        command: createConversationCommand
      });
    }
  }
};

export default plugin;
