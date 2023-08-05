import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';
// import { ITranslator } from '@jupyterlab/translation';
import { MainAreaWidget } from '@jupyterlab/apputils';
import { ILauncher } from '@jupyterlab/launcher';
import { reactIcon } from '@jupyterlab/ui-components';
import { VideoSegmentWidget } from './VideoSegment';
import { VideoPlayerWidget } from './VideoPlayer';
import { DataTableWidget } from './DataTable';

/**
 * The command IDs used by the react-widget plugin.
 */
namespace CommandIDs {
  export const createVideoSegment = 'create-video-segment-widget';
  export const createVideo = 'create-video-widget';
  export const createDataTable = 'create-datatable-widget';
}

/**
 * Initialization data for the react-widget extension.
 */
const plugin: JupyterFrontEndPlugin<void> = {
  id: '@jupyterlab-examples/server-extension:plugin',
  description:
    'A minimal JupyterLab extension with backend and frontend parts.',
  autoStart: true,
  optional: [ILauncher],
  activate: (
    app: JupyterFrontEnd,
    launcher: ILauncher
    // palette: ICommandPalette, , ICommandPalette, ITranslator
    // translator: ITranslator
  ) => {
    const { commands } = app;
    // const trans = translator.load('jupyterlab');

    // Create a shared instance of VideoSegmentWidget
    const sharedVideoSegmentWidget = new VideoSegmentWidget();

    const createVideoSegmentCommand = CommandIDs.createVideoSegment;
    commands.addCommand(createVideoSegmentCommand, {
      caption: 'Create a new Video Segment Widget',
      label: 'Video Segment Widget',
      icon: args => (args['isPalette'] ? undefined : reactIcon),
      execute: () => {
        // Use the shared instance when creating the MainAreaWidget
        const content = sharedVideoSegmentWidget;
        const widget = new MainAreaWidget<VideoSegmentWidget>({ content });
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
        const content = new VideoPlayerWidget(sharedVideoSegmentWidget);
        const widget = new MainAreaWidget<VideoPlayerWidget>({ content });
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
    }
  }
};

export default plugin;
