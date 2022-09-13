const express = require("express");
const morgan = require("morgan");
const cors = require("cors");

require("dotenv").config();

const Person = require("./models/person");

const app = express();

const unknownEndpoint = (request, response) => {
  response.status(404).send({
    error: "Unknown endpoint",
  });
};

const errorHandler = (error, request, response, next) => {
  console.error(error.message);
  if (error.name === "CastError") {
    return response.status(400).send({ error: "malformatted id" });
  } else if (error.name === "ValidationError") {
    return response.status(400).json({ error: error.message });
  }
  next(error);
};

morgan.token("body", function (req) {
  return JSON.stringify(req.body);
});

app.use(express.static("build"));
app.use(express.json());
app.use(cors());
app.use(
  morgan(":method :url :status :res[content-length] - :response-time ms :body")
);

// get the whole phonebook
app.get("/api/persons", (request, res, next) => {
  Person.find({})
    .then((people) => {
      if (people) {
        res.json(people);
      } else {
        res.status(404).end();
      }
    })
    .catch((error) => next(error));
});

// gets info of the phonebook
app.get("/info", (req, res) => {
  Person.find({}).then((people) => {
    console.log(people);
    let i = 0;
    people.map(() => i++);
    const date = new Date();

    res.json(`Phonebook has info for ${i} people ${date}`);
    console.log(date);
  });
});

// gets one person
app.get("/api/persons/:id", (req, res) => {
  Person.findById(req.params.id)
    .then((person) => {
      if (person) {
        res.json(person);
      } else {
        res.status(404).end();
      }
    })
    .catch((error) => {
      console.log(error);
      res.status(400).send({ error: "malformatted id" });
    });
});

// delete person
app.delete("/api/persons/:id", (req, res) => {
  Person.findByIdAndRemove(req.params.id)
    .then(() => {
      res.status(204).end();
    })
    .catch((error) => {
      console.log(error);
      res.status(400).send({ error: "malformatted id" });
    });
});

// generates random id
const generateId = () => {
  Math.floor(Math.random() * Math.floor(1000000));
};

// add a new contact
app.post("/api/persons", (req, res, next) => {
  const body = req.body;

  console.log("body is", body);

  if (body.name === "" || body.number === "") {
    return res.status(400).json({ error: "name/number missing" });
  }

  const person = new Person({
    name: body.name,
    number: body.number,
    id: generateId(),
  });

  person
    .save()
    .then((savedPerson) => {
      res.json(savedPerson);
    })
    .catch((error) => next(error));
});

// update number
app.put("/api/persons/:id", (request, response, next) => {
  const body = request.body;

  const updatedPerson = {
    name: body.name,
    number: body.number,
  };
  Person.findByIdAndUpdate(request.params.id, updatedPerson, { new: true })
    .then((result) => {
      response.json(result);
    })
    .catch((error) => next(error));
});

app.use(unknownEndpoint);
app.use(errorHandler);

const PORT = process.env.PORT;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
