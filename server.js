const express = require('express');
const app = express();
// const pug = require('pug');

app.use(express.urlencoded({ extended: false }));
app.use(express.json());

app.use('/css', express.static('resources/css'));
app.use("/js", express.static("resources/js/"));
app.use("/images", express.static("resources/images/"));

app.set("views", "templates");
app.set("view engine", "pug");

const port = 4131;

app.get("/", (req, res) => {
    res.render("main.pug");
});

app.get("/main.pug", (req, res) => {
    res.render("main.pug");
});

app.get("/myTodo.pug", (req, res) => {
    res.render("myTodo.pug");
});

app.get("/category.pug", (req, res) => {
    res.render("category.pug");
});

app.all('*', (req, res) => {
    res.status(404).render('404');
});

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});