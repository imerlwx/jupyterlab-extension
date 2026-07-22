import { URLExt } from '@jupyterlab/coreutils';

import { ServerConnection } from '@jupyterlab/services';

/**
 * Call the API extension
 *
 * @param endPoint API REST end point for the extension
 * @param init Initial values for the request
 * @returns The response body interpreted as JSON
 */
export async function requestAPI<T>(
  endPoint = '',
  init: RequestInit = {}
): Promise<T> {
  // Make request to Jupyter API
  const settings = ServerConnection.makeSettings();
  const requestUrl = URLExt.join(
    settings.baseUrl,
    'jlab_ext_example', // API Namespace
    endPoint
  );

  let response: Response;
  try {
    response = await ServerConnection.makeRequest(requestUrl, init, settings);
  } catch (error) {
    throw new ServerConnection.NetworkError(error as any);
  }

  let data: any = await response.text();

  if (data.length > 0) {
    try {
      data = JSON.parse(data);
    } catch (error) {
      console.log('Not a JSON response body.', response);
    }
  }

  if (!response.ok) {
    throw new ServerConnection.ResponseError(response, data.message || data);
  }

  return data;
}

/**
 * Best-effort POST that survives page unload, via navigator.sendBeacon.
 *
 * A normal fetch started in a `pagehide`/`beforeunload` handler is usually
 * cancelled by the browser, so it can't be used to log session end on close.
 * sendBeacon queues the request outside the page lifecycle. It can't set
 * headers, so the XSRF token is passed as the `_xsrf` query argument (Jupyter
 * accepts it there); the auth cookie is sent automatically for same-origin.
 * Returns false if the beacon could not be queued.
 */
export function beaconAPI(endPoint: string, body: Record<string, any>): boolean {
  if (typeof navigator === 'undefined' || !navigator.sendBeacon) {
    return false;
  }
  const settings = ServerConnection.makeSettings();
  let requestUrl = URLExt.join(settings.baseUrl, 'jlab_ext_example', endPoint);

  const xsrf = document.cookie
    .split('; ')
    .find(row => row.startsWith('_xsrf='))
    ?.split('=')[1];
  if (xsrf) {
    requestUrl += `?_xsrf=${encodeURIComponent(xsrf)}`;
  }

  try {
    // text/plain avoids a CORS preflight and matches the other handlers,
    // which read the raw JSON body.
    const blob = new Blob([JSON.stringify(body)], { type: 'text/plain' });
    return navigator.sendBeacon(requestUrl, blob);
  } catch (error) {
    return false;
  }
}
