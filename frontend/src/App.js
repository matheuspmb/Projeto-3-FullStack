import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [piada, setPiada] = useState('');
  const [categorias, setCategorias] = useState([]);
  const [mostrarCategorias, setMostrarCategorias] = useState(false);
  const [novaCategoria, setNovaCategoria] = useState('');
  const [keyword, setKeyword] = useState('');
  const [resultadoBuscaCategoria, setResultadoBuscaCategoria] = useState([]);
  const [resultadoBuscaKeyword, setResultadoBuscaKeyword] = useState([]);
  const [erro, setErro] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [token, setToken] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [buscaFeitaCategoria, setBuscaFeitaCategoria] = useState(false);
  const [buscaFeitaKeyword, setBuscaFeitaKeyword] = useState(false);
  const [mensagemNenhumResultadoCategoria, setMensagemNenhumResultadoCategoria] = useState(false);
  const [mensagemNenhumResultadoKeyword, setMensagemNenhumResultadoKeyword] = useState(false);

  useEffect(() => {
    if (isLoggedIn) {
      axios.get('https://api.chucknorris.io/jokes/categories')
        .then(response => {
          setCategorias(response.data || []);
          setErro('');
        })
        .catch(error => {
          console.error("Erro ao obter categorias: ", error);
          setErro('Erro ao obter categorias. Por favor, tente novamente mais tarde.');
        });
    }
  }, [isLoggedIn]);

  const login = useCallback(() => {
    axios.post('https://localhost:3001/login', { username, password })
      .then(response => {
        if (response.status === 200 && response.data.success) {
          setIsLoggedIn(true);
          setToken(response.data.token);
          setErro('');
          setResultadoBuscaCategoria([]);
          setResultadoBuscaKeyword([]);
          setBuscaFeitaCategoria(false);
          setBuscaFeitaKeyword(false);
          setMensagemNenhumResultadoCategoria(false);
          setMensagemNenhumResultadoKeyword(false);
        } else {
          setErro('Credenciais inválidas');
        }
      })
      .catch(error => {
        console.error("Erro ao realizar login: ", error);
        setErro('Erro ao realizar login. Por favor, tente novamente mais tarde.');
      });
  }, [username, password]);

  const register = useCallback(() => {
    axios.post('https://localhost:3001/register', { username: newUsername, password: newPassword })
      .then(response => {
        if (response.status === 200 && response.data.success) {
          setIsRegistering(false);
          setErro('Usuário registrado com sucesso! Você pode fazer login agora.');
        } else {
          setErro('Erro ao registrar usuário.');
        }
      })
      .catch(error => {
        console.error("Erro ao registrar usuário: ", error);
        setErro('Erro ao registrar usuário. Por favor, tente novamente mais tarde.');
      });
  }, [newUsername, newPassword]);

  const getPiadaAleatoria = useCallback(() => {
    if (!isLoggedIn) {
      setErro('Por favor, faça login para acessar essa funcionalidade.');
      return;
    }

    axios.get('https://api.chucknorris.io/jokes/random')
      .then(response => {
        setPiada(response.data.value);
        setErro('');
      })
      .catch(error => {
        console.error("Erro ao obter piada: ", error);
        setErro('Erro ao obter piada. Por favor, tente novamente mais tarde.');
      });
  }, [isLoggedIn]);

  const inserirPiada = useCallback(() => {
    if (!isLoggedIn) {
      setErro('Por favor, faça login para adicionar uma piada.');
      return;
    }

    const novaPiada = prompt('Digite a nova piada:');
    if (!novaPiada) {
      setErro('Piada não pode ser vazia.');
      return;
    }

    axios.post('https://localhost:3001/piadas', { content: novaPiada }, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(response => {
        if (response.data.success) {
          setErro('Piada adicionada com sucesso!');
          setPiada('');
          getPiadaAleatoria();
        } else {
          setErro('Erro ao adicionar piada.');
        }
      })
      .catch(error => {
        console.error("Erro ao adicionar piada: ", error);
        setErro('Erro ao adicionar piada. Por favor, tente novamente mais tarde.');
      });
  }, [isLoggedIn, token, getPiadaAleatoria]);

  const buscarPiadasPorCategoria = useCallback(() => {
    if (!isLoggedIn) {
      setErro('Por favor, faça login para buscar piadas.');
      return;
    }

    setBuscaFeitaCategoria(true);

    axios.get(`https://api.chucknorris.io/jokes/random?category=${novaCategoria}`)
      .then(response => {
        const resultado = [response.data];
        setResultadoBuscaCategoria(resultado);
        setMensagemNenhumResultadoCategoria(resultado.length === 0);
        setErro('');
      })
      .catch(error => {
        console.error("Erro ao buscar piadas: ", error);
        setErro('Erro ao buscar piadas. Por favor, tente novamente mais tarde.');
      });
  }, [isLoggedIn, novaCategoria]);

  const buscarPiadaPorKeyword = useCallback(() => {
    if (!isLoggedIn) {
      setErro('Por favor, faça login para buscar piadas.');
      return;
    }

    setBuscaFeitaKeyword(true);

    axios.get(`https://api.chucknorris.io/jokes/search?query=${keyword}`)
      .then(response => {
        const resultado = response.data.result || [];
        setResultadoBuscaKeyword(resultado);
        setMensagemNenhumResultadoKeyword(resultado.length === 0);
        setErro('');
      })
      .catch(error => {
        console.error("Erro ao buscar piadas: ", error);
        setErro('Erro ao buscar piadas. Por favor, tente novamente mais tarde.');
      });
  }, [isLoggedIn, keyword]);

  const limparResultadosCategoria = () => {
    setResultadoBuscaCategoria([]);
    setBuscaFeitaCategoria(false);
    setMensagemNenhumResultadoCategoria(false);
  };

  const limparResultadosKeyword = () => {
    setResultadoBuscaKeyword([]);
    setBuscaFeitaKeyword(false);
    setMensagemNenhumResultadoKeyword(false);
  };

  const toggleCategorias = () => {
    setMostrarCategorias(prevState => !prevState);
  };

  return (
    <div className="App">
      {!isLoggedIn ? (
        <div className="login-container">
          <img src="ChuckNorris.png" alt="Chuck Norris" height="200" width="400" />
          {!isRegistering ? (
            <>
              <h2>Login</h2>
              <input type="text" placeholder="Usuário" value={username} onChange={(e) => setUsername(e.target.value)} />
              <input type="password" placeholder="Senha" value={password} onChange={(e) => setPassword(e.target.value)} />
              <button onClick={login}>Entrar</button>
              <button onClick={() => setIsRegistering(true)}>Registrar</button>
              {erro && <p className="error-message">{erro}</p>}
            </>
          ) : (
            <>
              <h2>Registrar</h2>
              <input type="text" placeholder="Novo Usuário" value={newUsername} onChange={(e) => setNewUsername(e.target.value)} />
              <input type="password" placeholder="Nova Senha" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
              <button onClick={register}>Registrar</button>
              <button onClick={() => setIsRegistering(false)}>Voltar</button>
              {erro && <p className="error-message">{erro}</p>}
            </>
          )}
        </div>
      ) : (
        <>
          <div className="login-container">
            <img src="ChuckNorris.png" alt="Chuck Norris" height="200" width="400" />
          </div>

          <h2>Bem-vindo, {username}!</h2>
          <div className="piada">
            <button onClick={getPiadaAleatoria}>Piada Aleatória</button>
            <p>{piada}</p>
          </div>

          <div className="inserir-piada">
            <button onClick={inserirPiada}>Adicionar Piada</button>
          </div>

          <div className="categorias">
            <button onClick={toggleCategorias}>
              {mostrarCategorias ? 'Ocultar Categorias' : 'Mostrar Categorias'}
            </button>
            {mostrarCategorias && (
              <div className="categorias-lista">
                {categorias.map((categoria, index) => (
                  <p key={index}>{categoria}</p>
                ))}
              </div>
            )}
          </div>

          <div className="busca-piada">
            <h3>Buscar Piada por Categoria</h3>
            <input type="text" placeholder="Digite a categoria" value={novaCategoria} onChange={(e) => setNovaCategoria(e.target.value)} />
            <button onClick={buscarPiadasPorCategoria}>Buscar</button>
            <button onClick={limparResultadosCategoria}>Limpar</button>
            <div className="resultado-busca">
              {resultadoBuscaCategoria.length > 0 ? (
                resultadoBuscaCategoria.map((piada, index) => (
                  <p key={index}>{piada.value}</p>
                ))
              ) : (
                mensagemNenhumResultadoCategoria && <p>Nenhum resultado encontrado.</p>
              )}
            </div>
          </div>

          <div className="busca-keyword">
            <h3>Buscar Piada por Palavra-chave</h3>
            <input type="text" placeholder="Digite a palavra-chave" value={keyword} onChange={(e) => setKeyword(e.target.value)} />
            <button onClick={buscarPiadaPorKeyword}>Buscar</button>
            <button onClick={limparResultadosKeyword}>Limpar</button>
            <div className="resultado-busca">
              {resultadoBuscaKeyword.length > 0 ? (
                resultadoBuscaKeyword.map((piada, index) => (
                  <p key={index}>{piada.value}</p>
                ))
              ) : (
                mensagemNenhumResultadoKeyword && <p>Nenhum resultado encontrado.</p>
              )}
            </div>
          </div>
        </>
      )}
      {erro && <p className="error-message">{erro}</p>}
    </div>
  );
}

export default App;
