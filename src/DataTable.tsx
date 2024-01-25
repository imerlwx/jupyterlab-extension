import axios from 'axios';
import React, { useState, useEffect } from 'react';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import Papa from 'papaparse';
import { ReactWidget } from '@jupyterlab/ui-components';
import { ChatWidget, IVideoId } from './Chat';
import { requestAPI } from './handler';
import { Tabs, Tab, Paper } from '@mui/material';

interface IDataTableProps {
  videoId: string;
}

interface IColumnDefs {
  headerName: string;
  field: string;
}

interface ICsvData {
  name: string;
  data: any[];
  columns: IColumnDefs[];
}

const defaultColDef = {
  sortable: true,
  filter: true,
  resizable: true,
  editable: true
};

function parseCsv(csvData: string) {
  let parsedData: any[] = [];

  Papa.parse(csvData, {
    header: true,
    skipEmptyLines: true,
    complete: function (results) {
      parsedData = results.data;
    }
  });

  return parsedData;
}

const DataTableComponent = (props: IDataTableProps): JSX.Element => {
  const [csvData, setCsvData] = useState<ICsvData[]>([]);
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    requestAPI<any>('data', {
      body: JSON.stringify({ videoId: props.videoId }),
      method: 'POST'
    })
      .then(response => {
        Promise.all(
          response.map((csvFile: any) =>
            axios.get(csvFile.download_url).then(res => {
              const data = parseCsv(res.data);
              const columns = Object.keys(data[0]).map(key => ({
                headerName: key,
                field: key
              }));
              return { name: csvFile.name, data: data, columns: columns };
            })
          )
        )
          .then(data => {
            console.log(data);
            setCsvData(data);
          })
          .catch(error => console.log(error));
      })
      .catch(reason => {
        console.error(
          `Error on POST /jlab_ext_example/data ${props.videoId}.\n${reason}`
        );
      });
  }, [props.videoId]);

  const handleChange = (event: React.ChangeEvent<object>, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <Paper elevation={3} sx={{ borderRadius: 2, backgroundColor: '#e0e0e0' }}>
      <Tabs
        value={tabValue}
        onChange={handleChange}
        variant="scrollable"
        scrollButtons="auto"
      >
        {csvData.map((data, index) => (
          <Tab label={data.name} key={index} />
        ))}
      </Tabs>
      <div
        className="ag-theme-alpine"
        style={{ height: 400, width: '100%', overflow: 'auto' }}
      >
        {csvData.map(
          (data, index) =>
            tabValue === index && (
              <AgGridReact
                columnDefs={data.columns}
                rowData={data.data}
                defaultColDef={defaultColDef}
                animateRows={true}
                rowSelection="multiple"
                onGridReady={params => params.api.sizeColumnsToFit()}
                onCellValueChanged={event =>
                  console.log('Cell Value Changed', event)
                }
                onSelectionChanged={event => console.log('Row Selected', event)}
                key={index}
              />
            )
        )}
      </div>
    </Paper>
  );
};

export class DataTableWidget extends ReactWidget {
  private _videoId = '';

  constructor(ChatWidget: ChatWidget) {
    super();
    this.addClass('jp-react-widget');
    ChatWidget.videoIdChanged.connect(this._onVideoIdChanged, this);
  }

  private _onVideoIdChanged = (emitter: ChatWidget, videoId: IVideoId) => {
    this._videoId = videoId.videoId;
    this.update();
  };

  render(): JSX.Element {
    return <DataTableComponent videoId={this._videoId} />;
  }
}
