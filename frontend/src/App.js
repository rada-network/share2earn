import React from 'react';
import { Container } from "@mui/material"
import { Header } from "./components/Header"
import { Main } from "./components/Main"
import './App.css';

function App() {

  return (
    <div className="App">
      <Header />
      <Container maxWidth="md">
        <Main />
      </Container>
    </div>
  );
}

export default App;
