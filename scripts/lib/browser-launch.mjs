import {chromium,firefox,webkit} from 'playwright';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';

const defaultEngines={chromium,firefox,webkit};
export async function launchBrowser(engine,options={}){
 const driver=process.argv.find(arg=>arg.startsWith('--driver='))?.slice(9);
 const engines=driver?await import(pathToFileURL(resolve(driver)).href):defaultEngines;
 if(!engines[engine])throw Error(`Unknown browser: ${engine}`);
 const executablePath=process.argv.find(arg=>arg.startsWith('--executable='))?.slice(13);
 // Playwright 1.64's Firefox shares macOS application-data discovery with the
 // installed personal Firefox. Isolate that discovery as well as the profile.
 // https://github.com/microsoft/playwright/issues/42768
 const appData=engine==='firefox'&&process.platform==='darwin'?await mkdtemp(join(tmpdir(),'graphpaper-firefox-appdata-')):null;
 const cleanup=async()=>{
  if(!appData)return;
  try{await rm(appData,{recursive:true,force:true});}
  catch(error){
   // macOS can protect generated special home directories such as Downloads,
   // even under a disposable root. Leave those in OS temporary storage rather
   // than changing permissions or allowing cleanup to mask validation results.
   if(!['EACCES','EPERM'].includes(error.code))throw error;
  }
 };
 let browser;
 try{browser=await engines[engine].launch({...options,...(executablePath?{executablePath}:{}),...(appData?{env:{...process.env,...options.env,CFFIXED_USER_HOME:appData}}:{})});}
 catch(error){await cleanup();throw error;}
 const close=browser.close.bind(browser);
 browser.close=async(...args)=>{try{return await close(...args);}finally{await cleanup();}};
 return browser;
}
