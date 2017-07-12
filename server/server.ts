import * as express from 'express';
import * as ws from 'express-ws';

const app = express();
ws(app);

// const state = {
//   speakers: {
//     michel: 0,
//     joao: 0
//   }
// };

app.use(express.static(__dirname + '/..'));

app.ws('/', (ws, req) => {
  ws.on('message', msg => console.log('web socket: ', msg));
  console.log('socket', req.testing);
});

app.listen(8080, () => {
  console.log('Web server running in http://localhost:8080');
});