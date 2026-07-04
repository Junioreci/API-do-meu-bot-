const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const axios = require('axios');
const cheerio = require('cheerio');
const path = require('path');
const fs = require('fs');
var fetch = require('node-fetch');
var cron = require('node-cron');
const cfonts = require("cfonts");
const ffmpeg = require("fluent-ffmpeg");
const zrapi = require("zrapi");
var thiccysapi = require('textmaker-thiccy');
var { Maker } = require('imagemaker.js');
const multer = require('multer');
const { instagram } = require('betabotz-tools');

const app = express();
const port = process.env.PORT || 3000; // O Render vai injetar a porta correta aqui automaticamente
var router = express.Router();

// ------ CONFIGURAÇÕES DO SERVER ------ \\
app.use(cors());
app.set("json spaces", 2);
app.use(express.static("public"));
app.use(express.json());
app.use(router);

// Rota padrão para a hospedagem saber que a API está online
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, "./public/", "docs.html"));
});

// ------ SCRAPPERS ------ \\
const { payment } = require('./PixAPI-MercadoPago-Js/index.js');
const { igstalk } = require('./lib/instagram');
var { color } = require('./lib/color.js');
const { mediafireDl } = require('./scrapers/mediafire.js');
var { kwaiDownload } = require('./scrapers/kwai.js');
var { generateImage } = require('./scrapers/imagine.js');
var { pinterest, getBuffer, fetchJson, ping } = require('./lib/funcoes.js'); 
var { styletext } = require('./scrapers/scraper.js');
const { RequestsAdd } = require('./scrapers/totalreq.js'); // Corrigido o 'bla +' que quebraria o código   
const { chatGpt } = require('./scrapers/chatgpt');
const wallpaper = JSON.parse(fs.readFileSync("./scrapers/wallpaper.json"));
var { YTNomeSearch } = require('./scrapers/youtoba.js');
const {
  ytDonlodMp3,
  ytDonlodMp4,
  ytPlayMp3,
  ytPlayMp4,
  ytSearch
} = require("./scrapers/youtube");

// ------ INFO ------ \\
var msgerro = 'Erro Ocorrido Contate O suporte!';
var criador = "@Giulian - WHATSAPP: +55 (17) 99728-55725"; 

// ------ SISTEMA DE KEYS ------ \\
var key = JSON.parse(fs.readFileSync("./lib/secret/keys.json"));
const users = JSON.parse(fs.readFileSync("./lib/secret/usuarios.json"));
const pendingPayments = {}; 

async function listkeys(apitoken, req) {
    var i4 = key.map(i => i?.apitoken)?.indexOf(apitoken);
    if(i4 >= 0) {
        key[i4].request -= 2;
        fs.writeFileSync("./lib/secret/keys.json", JSON.stringify(key, null, 2));
        await RequestsAdd(); 
        var IP = req.headers['x-real-ip'] || req.connection.remoteAddress || 0;
        var i3 = users.map(i => i.key).indexOf(apitoken);
        if(i3 < 0 && !users.map(i => i.IP).includes(IP?.split(":")[3])){
            users.push({key: apitoken, IP: [IP?.split(":")[3]]});
            fs.writeFileSync("./lib/secret/usuarios.json", JSON.stringify(users, null, 2));
        } else if(i3 >= 0 && !users[i3]?.IP.includes(IP?.split(":")[3])) {
            users[i3].IP.push(IP?.split(":")[3]);
            fs.writeFileSync("./lib/secret/usuarios.json", JSON.stringify(users, null, 2));
        }
    }
} 

// Upload Config
const storage = multer.diskStorage({
    destination: './uploads/',
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// ------ SISTEMA DAS PÁGINAS ------ \\
app.get('/docs', (req, res) => { res.sendFile(path.join(__dirname, '/public', 'index.html')); });
app.get('/panel', (req, res) => { res.sendFile(path.join(__dirname, "./public/", "admin.html")); });
app.get('/planos', (req, res) => { res.sendFile(path.join(__dirname, "./public/", "planos.html")); });
app.get('/pack', (req, res) => { res.sendFile(path.join(__dirname, "./public/", "cases.html")); });
app.get('/uploader', (req, res) => { res.sendFile(path.join(__dirname, "./public/", "upload.html")); }); 

// ------ SISTEMA DAS APIS ------ \\
app.get('/api/keyerrada', (req, res) => {
    var apitoken = req.query.apitoken;
    var ITC = key.map(i => i?.apitoken)?.indexOf(apitoken);
    if(ITC < 0) {
        return res.json({key:' ❌ Sua apitoken é invalida!! ❌'});
    } else {
        return res.json({key:`🔑 Sua Apitoken está 100% ✅ • Requisições Restantes: ${key[ITC]?.request}`});
    }
});

app.get('/api/status/key', (req, res) => {
    var apitoken = req.query.apitoken;
    var ITC = key.map(i => i?.apitoken)?.indexOf(apitoken);
    if(ITC < 0) {
        return res.json({key:' ❌ Sua apitoken é invalida!! ❌'});
    } else {
        return res.json({key:`${key[ITC]?.request}`});
    }
});

app.get('/api/status/apitoken', (req, res) => {
    var apitoken = req.query.apitoken;
    if(key.map(i => i.apitoken).includes(apitoken)) {
        return res.json({resultado: "Essa key já está inclusa dentro do sistema.."});
    } else {
        return res.json({resultado: `Não está inclusa`});
    }
});
 
app.get('/api/add-key', (req, res) => {
    let a = req.query.a;
    if(!a.includes("&")) return res.json({resultado: "Faltando o &"});
    var [apitoken, senha, rq] = a.split("&");
    var senhaofc = "K23";
    if(senha != senhaofc) return res.json({resultado: "Senha invalida.."});
    if(!apitoken) return res.json({resultado: "Kd a key.."});
    if(key.map(i => i.apitoken).includes(apitoken)) {
        return res.json({resultado: "Essa key já está inclusa dentro do sistema.."});
    } else {
        key.push({apitoken: apitoken, request: rq});
        fs.writeFileSync("./lib/secret/keys.json", JSON.stringify(key));
        var ITC = key.map(i => i?.apitoken)?.indexOf(apitoken);
        return res.json({resultado: `🔑 Apitoken: ${apitoken} Foi Adicionada ao Sistema com Exito!\n🚀 Numero de Requisições Disponiveis: ${key[ITC]?.request}`});
    }
});
 
app.get('/api/del-key', (req, res) => {
    let a = req.query.a;
    if(!a.includes("&")) return res.json({resultado: "Faltando o &"});
    var [apitoken, senha] = a.split("&");
    var senhaofc = "K23";
    if(senha != senhaofc) return res.json({resultado: "Senha invalida.."});
    if(!apitoken) return res.json({resultado: "Kd a key.."});
    if(!key.map(i => i.apitoken).includes(apitoken)) {
        return res.json({resultado: "Essa key não está inclusa.."});
    } else {
        var i2 = key.map(i => i.apitoken).indexOf(apitoken);
        key.splice(i2, 1);
        fs.writeFileSync("./lib/secret/keys.json", JSON.stringify(key));
        return res.json({resultado: `🔑 Apitoken ${apitoken} deletada com sucesso..`});
    }
});

app.post('/create_payment', async (req, res) => {
    const { value, apiKey } = req.body;
    const accessToken = 'TOKEN MERCADO PAGO';
    try {
        const paymentInstance = new payment(accessToken);
        const paymentInfo = await paymentInstance.create_payment(value);
        pendingPayments[paymentInfo.id] = apiKey;
        res.json(paymentInfo);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/check_payment/:payment_id', async (req, res) => {
    const { payment_id } = req.params;
    const apiKey = pendingPayments[payment_id];
    const accessToken = 'TOKEN MERCADO PAGO';
    if (!apiKey) return res.json({ resultado: "Chave não encontrada para esse pagamento." });

    try {
        const paymentInstance = new payment(accessToken);
        paymentInstance.payment_id = payment_id;
        const paymentStatus = await paymentInstance.check_payment();

        if (paymentStatus.status === 'approved') {
            if (key.some(k => k.apitoken === apiKey)) {
                return res.json({ resultado: "Essa chave já está registrada no sistema." });
            } else {
                key.push({ apitoken: apiKey, request: paymentStatus.request });
                fs.writeFileSync('./lib/secret/keys.json', JSON.stringify(key, null, 2));
                delete pendingPayments[payment_id];
                return res.json({ resultado: "Pagamento aprovado e chave adicionada!" });
            }
        } else if (paymentStatus.status === 'rejected') {
            delete pendingPayments[payment_id];
            return res.json({ resultado: "Pagamento rejeitado." });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/insta-stalk', async(req, res) => {
    var apitoken = req.query.apitoken;
    if(key[key.map(i => i?.apitoken)?.indexOf(apitoken)]?.request <= 0) return res.sendFile(path.join(__dirname, "./public/", "limited.html"));
    if(!apitoken) return res.json({resultado:'Cade o parametro apitoken?'});
    if(!key.map(i => i.apitoken)?.includes(apitoken)) return res.sendFile(path.join(__dirname, "./public/", "limited.html"));
    await listkeys(apitoken, req);
    
    let username = req.query.query;
    if (!username) return res.json({ status : false, criador : `${criador}`, resultado : "Coloque o parametro: query (username)"});
    try {
        const api = await igstalk(username);
        const anu = api.data;
        res.json({
            status: true,
            código: 200,
            criador: `${criador}`, 
            resultado: {
                id: anu.id,
                nomeCompleto: anu.fullname,
                privado: anu.private,
                verificado: anu.verified,
                bio: anu.bio,
                seguidores: anu.follower,
                seguindo: anu.following,
                photoProfile: api.profile
            }
        });
    } catch (err) {
        res.json({resultado: `${err}`});
    }
});

app.post('/upload', upload.single('image'), (req, res) => {
    if (req.file) {
        const imageUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
        res.json({ link: imageUrl });
    } else {
        res.status(400).send('Erro ao fazer upload');
    }
});

app.get('/uploads/:id', (req, res) => {
    const filePath = path.join(__dirname, 'uploads', req.params.id);
    if (fs.existsSync(filePath)) {
        res.sendFile(filePath);
    } else {
        res.status(404).send('Arquivo não encontrado');
    }
});

app.get('/download/mediafire', async (req, res) => {
    var apitoken = req.query.apitoken;
    if(key[key.map(i => i?.apitoken)?.indexOf(apitoken)]?.request <= 0) return res.sendFile(path.join(__dirname, "./public/", "limited.html"));
    if(!apitoken) return res.json({resultado:'Cade o parametro apitoken?'});
    await listkeys(apitoken, req);
    let url = req.query.url;
    if (!url) return res.json({ status : false, creator : `${criador}`, resultado : "Cade o parametro url?"});
    mediafireDl(url).then(data => {
        res.json({ status: true, código: 200, criador: `${criador}`, resultado: data });
    }).catch(e => { res.json({resultado: `${msgerro}`}); });
});

app.get('/ias/gpt', async (req, res) => {
    let query = req.query.query;
    if(!query) return res.json({status:false, resultado: 'Cade o parametro query??'});
    var apitoken = req.query.apitoken;
    if(!apitoken) return res.json({resultado:'Cade o parametro apitoken?'});
    await listkeys(apitoken, req);
    let anu = await chatGpt(`${query}`);
    res.json({ status: true, criador: `${criador}`, resultado: `${anu.result}` });
});

app.get('/api/pinterest', async (req, res) => {
    var apitoken = req.query.apitoken;
    if(!apitoken) return res.json({resultado:'Cade o parametro apitoken?'});
    await listkeys(apitoken, req);
    let text = req.query.text;
    if (!text) return res.json({ status : false, resultado : "Cade o parametro text?"});
    let pin = await pinterest(text);
    let ac = pin[Math.floor(Math.random() * pin.length)];
    res.type('jpg');
    res.send(await getBuffer(ac));
});

router.get('/download/play-mp3', async(req, res) => {
    let nome = req.query.nome;
    if(!nome) return res.json({status:false, resultado:'Cade o parametro nome??'}); 
    var apitoken = req.query.apitoken;
    if(!apitoken) return res.json({resultado:'Cade o parametro apitoken?'});
    await listkeys(apitoken, req);
    try {
        let api = await YTNomeSearch(nome);
        res.set('Content-Type', 'audio/mp3');
        res.send(await getBuffer(api.audiourl));
    } catch(e) {
        res.json({resultado: `${msgerro}`});
    }
});

// Inicialização do servidor
app.listen(port, () => {
    console.log(`Servidor rodando perfeitamente na porta ${port}`);
});
