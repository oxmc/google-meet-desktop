/* All window creation functions */
const { BrowserWindow, BrowserView, ipcMain, screen, app } = require("electron");
const windowStateKeeper = require("electron-window-state");
const path = require("path");
const fs = require("fs");
var appdir = app.getAppPath();
const config = require(`${appdir}/src/main/config.json`);

/* Window functions */
function createMainWindow() {
  const SplashWindow = (global.SplashWindow = new BrowserWindow({
    width: 390,
    height: 370,
    frame: false,
    transparent: false,
    skipTaskbar: true,
    center: true,
    icon: `${appdir}/src/main/renderer/assets/app.png`,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    }
  }));
  SplashWindow.loadFile(`${appdir}/src/renderer/splash.html`);
  //SplashWindow.webContents.openDevTools();
  const mainWindowState = windowStateKeeper({
    defaultWidth: 1200,
    defaultHeight: 400,
    fullScreen: false,
    maximize: true,
  });
  const mainWindow = (global.mainWindow = new BrowserWindow({
    x: mainWindowState.x,
    y: mainWindowState.y,
    width: mainWindowState.width,
    height: mainWindowState.height,
    minWidth: 800,
    minHeight: 400,
    frame: false,
    center: true,
    webPreferences: {
      contextIsolation: true,
      preload: `${appdir}/src/renderer/preload.js`,
    },
  }));
  mainWindowState.manage(mainWindow);
  mainWindow.loadFile(`${appdir}/src/renderer/index.html`);
  //mainWindow.webContents.openDevTools();
  mainWindow.hide();
  const googleMeetView = (global.googleMeetView = new BrowserView({
    webPreferences: {
      preload: `${appdir}/src/renderer/preload-2.js`,
    },
  }));
  mainWindow.setBrowserView(googleMeetView);
  googleMeetView.webContents.loadURL(config.URL);
  googleMeetView.setBounds({
    x: 0,
    y: 40,
    width: mainWindow.getBounds().width,
    height: mainWindow.getBounds().height - 40,
  });
  googleMeetView.webContents.on("did-finish-load", () => {
    googleMeetView.webContents.insertCSS(
      fs.readFileSync(`${appdir}/src/renderer/css/screen.css`).toString()
    );
  });
  //googleMeetView.webContents.openDevTools();
  mainWindow.on("resize", () => {
    googleMeetView.setBounds({
      x: 0,
      y: 40,
      width: mainWindow.getBounds().width,
      height: mainWindow.getBounds().height - 40,
    });
  });
  /* Buttons */
  mainWindow.on("maximize", () => {
    mainWindow.webContents.send("window.maximized");
  });
  mainWindow.on("unmaximize", () => {
    mainWindow.webContents.send("window.restored");
  });
  ipcMain.on("window.minimize", (event) => {
    mainWindow.minimize();
  });
  ipcMain.on("window.maximize", (event) => {
    mainWindow.maximize();
    event.sender.send("window.maximized");
  });
  ipcMain.on("window.restore", (event) => {
    mainWindow.unmaximize();
    event.sender.send("window.restored");
  });
  ipcMain.on("window.close", () => {
    mainWindow.close();
    app.quit();
  });
  ipcMain.on("window.home", () => {
    googleMeetView.webContents.loadURL(config.URL);
  });
  /* Canvas window */
  let canvasWindow = createCanvasWindow();
  const screenToolsWindow = createScreenToolsWindow();
  // screenToolsWindow.moveAbove(canvasWindow.getMediaSourceId());
  /* Buttons */
  ipcMain.on("window.screenshare.show", () => {
    mainWindow.minimize();
    screenToolsWindow.show();
  });
  ipcMain.on("window.screenshare.hide", () => {
    screenToolsWindow.hide();
    screenToolsWindow.reload();
    canvasWindow.hide();
  });
  ipcMain.on("window.canvas.show", () => {
    canvasWindow.show();
  });
  ipcMain.on("window.canvas.hide", () => {
    canvasWindow.hide();
    canvasWindow.reload();
  });
  ipcMain.on("window.main.focus", () => {
    mainWindow.restore();
    mainWindow.focus();
  });
  ipcMain.on("screenshare.stop", () => {
    googleMeetView.webContents.send("screenshare.stop");
  });
}
/* Canvas window function */
function createCanvasWindow() {
  const primaryWorkarea = screen.getPrimaryDisplay().bounds;
  const canvasWindow = new BrowserWindow({
    x: primaryWorkarea.x,
    y: primaryWorkarea.y,
    width: primaryWorkarea.width,
    height: primaryWorkarea.height,
    transparent: true,
    frame: false,
    webPreferences: {
      contextIsolation: true,
      preload: `${appdir}/src/renderer/preload.js`,
    },
    focusable: false,
    show: false,
    resizable: false,
    skipTaskbar: true,
  });
  canvasWindow.webContents.loadFile(`${appdir}/src/renderer/canvas.html`);
  canvasWindow.setAlwaysOnTop(true, "pop-up-menu");
  return canvasWindow;
}
/* Screen tools window */
function createScreenToolsWindow() {
  const primaryWorkarea = screen.getPrimaryDisplay().bounds;
  const screenToolsWindow = new BrowserWindow({
    x: 100,
    y: primaryWorkarea.height - 200,
    height: 60,
    width: 300,
    frame: false,
    resizable: false,
    show: false,
    skipTaskbar: true,
    focusable: false,
    transparent: true,
    webPreferences: {
      contextIsolation: true,
      preload: `${appdir}/src/renderer/preload.js`,
    },
  });
  screenToolsWindow.setContentProtection(process.platform === "darwin");
  screenToolsWindow.webContents.loadFile(`${appdir}/src/renderer/toolbar.html`);
  screenToolsWindow.setAlwaysOnTop(true, "screen-saver");
  return screenToolsWindow;
}
/* Export functions */
module.exports = { createMainWindow };
