import React, { useState } from 'react';
import axios from 'axios';
import './App.css'; // Importe o arquivo CSS para estilização

function App() {
    // Estados de controle da aplicação
    const [piada, setPiada] = useState('');
    const [categorias, setCategorias] = useState([]);
    const [keyword, setKeyword] = useState('');
    const [resultadoBusca, setResultadoBusca] = useState([]);
    const [erro, setErro] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [token, setToken] = useState('');
    const [categoriasVisiveis, setCategoriasVisiveis] = useState(false); // Novo estado para visibilidade das categorias

    // Função de login
    const login = () => {
      axios.post('http://localhost:3001/login', { username, password })
          .then(response => {
              if (response.status === 200 && response.data.success) {
                  setIsLoggedIn(true);
                  setToken(response.data.token);
                  setErro('');
              } else {
                  setErro('Credenciais inválidas');
              }
          })
          .catch(error => {
              console.error("Erro ao realizar login: ", error);
              setErro('Erro ao realizar login. Por favor, tente novamente mais tarde.');
          });
    };

    const getPiadaAleatoria = () => {
      if (!isLoggedIn) {
          setErro('Por favor, faça login para acessar essa funcionalidade.');
          return;
      }
  
      axios.get('http://localhost:3001/piadas', {
          headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(response => {
          console.log(response);
          if (response.data.piadas) {
              setPiada(response.data.piadas);
              setErro('');
          } else {
              setErro('Erro ao obter piada. Resposta inesperada.');
          }
      })
      .catch(error => {
          console.error("Erro ao obter piada: ", error);
          setErro('Erro ao obter piada. Por favor, tente novamente mais tarde.');
      });
  };

    const getCategorias = () => {
        if (!isLoggedIn) {
            setErro('Por favor, faça login para acessar essa funcionalidade.');
            return;
        }

        if (categoriasVisiveis) {
            // Se as categorias estão visíveis, esconda-as
            setCategorias([]);
            setCategoriasVisiveis(false);
        } else {
            // Caso contrário, obtenha as categorias
            axios.get('https://api.chucknorris.io/jokes/categories')
                .then(response => {
                    setCategorias(response.data);
                    setCategoriasVisiveis(true);
                    setErro('');
                })
                .catch(error => {
                    console.error("Erro ao obter categorias: ", error);
                    setErro('Erro ao obter categorias. Por favor, tente novamente mais tarde.');
                });
        }
    };

    const buscarPorPalavraChave = () => {
        if (!isLoggedIn) {
            setErro('Por favor, faça login para acessar essa funcionalidade.');
            return;
        }

        if (keyword === '') {
            setErro('Por favor, digite uma palavra-chave para buscar.');
            return;
        }

        axios.get(`https://api.chucknorris.io/jokes/search?query=${keyword}`)
            .then(response => {
                if (response.data.result.length === 0) {
                    setResultadoBusca(['Nenhuma piada encontrada com essa palavra-chave.']);
                    setErro('');
                    return;
                }

                const piadasEncontradas = response.data.result.map(piada => piada.value);
                setResultadoBusca(piadasEncontradas);
                setErro('');
            })
            .catch(error => {
                console.error("Erro ao buscar por palavra-chave: ", error);
                setErro('Erro ao buscar por palavra-chave. Por favor, tente novamente mais tarde.');
            });
    };

    return (
        <div className="App">
            {!isLoggedIn ? (
                <div className="login-container">
                    <h3>Login</h3>
                    <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Usuário"
                    />
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Senha"
                    />
                    <button onClick={login}>Login</button>
                    {erro && <p className="error-message">{erro}</p>}
                </div>
            ) : (
                <>
                    <div className="image-container">
                        <img src="ChuckNorris.png" alt="Chuck Norris" />
                    </div>
                    <div className="piada">
                        <h1>Piadas do Chuck Norris</h1>
                        <p>Clique no botão abaixo para receber uma piada</p>
                        <button onClick={getPiadaAleatoria}>Piada aleatória</button>
                        <p>{piada}</p>
                    </div>
                    <div className="categorias">
                        <h3>Categorias</h3>
                        <p>Para ver as categorias das piadas, clique no botão abaixo</p>
                        <button onClick={getCategorias}>
                            {categoriasVisiveis ? 'Esconder Categorias' : 'Categorias'}
                        </button>
                        {categoriasVisiveis && (
                            <ul>
                                {categorias.map((categoria, index) => (
                                    <li key={index}>{categoria}</li>
                                ))}
                            </ul>
                        )}
                    </div>
                    <div className="busca">
                        <h3>Busca por palavra-chave</h3>
                        <input
                            type="text"
                            value={keyword}
                            onChange={(e) => setKeyword(e.target.value)}
                            placeholder="Digite uma palavra-chave"
                        />
                        <button onClick={buscarPorPalavraChave}>Buscar</button>
                        {resultadoBusca.length > 0 && (
                            <ul>
                                {resultadoBusca.map((piada, index) => (
                                    <li key={index}>{piada}</li>
                                ))}
                            </ul>
                        )}
                    </div>
                </>
            )}
            {erro && <p className="error-message">{erro}</p>}
        </div>
    );
}

export default App;
