import * as express from 'express';

const app = express();

app.use(express.static(__dirname + '/..'));

app.listen(8080, () => {
  console.log('Web server running in http://localhost:8080');
});