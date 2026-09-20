// Root forwarder to next-app test script
import path from 'path';
import { pathToFileURL } from 'url';

const targetPath = path.resolve(process.cwd(), 'next-app', 'src', 'tests', 'test_razorpay.ts');
import(pathToFileURL(targetPath).href);
