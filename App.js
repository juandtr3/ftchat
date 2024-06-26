import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ImageBackground, Share, TextInput, Alert, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const StatsScreen = ({ onGoBack, playerScores }) => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [players, setPlayers] = useState([]);
  const [currentPlayer, setCurrentPlayer] = useState(null);
  const [playerPoints, setPlayerPoints] = useState(null);
  const [showCreatePlayerForm, setShowCreatePlayerForm] = useState(false);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [newPlayerScore, setNewPlayerScore] = useState('');
  const [editPlayerMode, setEditPlayerMode] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState('');
  const [editedPlayerName, setEditedPlayerName] = useState('');
  const [editedPlayerScore, setEditedPlayerScore] = useState('');
  const [playerToDelete, setPlayerToDelete] = useState('');

  const scrollViewRef = useRef();

  useEffect(() => {
    setMessages([
      {
        _id: 1,
        text: '¡Bienvenido al chatbot de tu juego! ¿En qué puedo ayudarte?',
        createdAt: new Date(),
        user: {
          _id: 2,
          name: 'Bot',
        },
      },
    ]);

    loadPlayers();
  }, []);

  useEffect(() => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollToEnd({ animated: true });
    }
  }, [messages]);

  const loadPlayers = async () => {
    try {
      const playersData = await AsyncStorage.getItem('players');
      if (playersData) {
        const loadedPlayers = JSON.parse(playersData);
        setPlayers(loadedPlayers);
      } else {
        setDefaultPlayers();
      }
    } catch (error) {
      console.error('Error loading players:', error.message);
    }
  };
  const handleClearData = async () => {
  try {
    await AsyncStorage.removeItem('players'); // Eliminar solo los datos guardados
    console.log('Datos guardados eliminados correctamente');
    // Añade aquí cualquier mensaje de confirmación o actualización de la interfaz de usuario
  } catch (error) {
    console.error('Error al eliminar datos guardados:', error.message);
    // Maneja cualquier error que pueda ocurrir durante la eliminación de datos
  }
};


 const setDefaultPlayers = async () => {
  const defaultPlayers = [
    { name: '1. RUPERTO', score: 100000 },
    { name: '2. MAECHA', score: 100000 },
    { name: '3. LONDOÑO ', score: 100000 },
    { name: '4. VALDERRAMA', score: 100000 },
    { name: '5. RODIGUEZ', score: 100000 },
     { name: '6. ATAPUMA', score: 100000 },
  ];

  setPlayers(defaultPlayers);
  savePlayers(defaultPlayers);
};


  const savePlayers = async (playersToSave) => {
    try {
      await AsyncStorage.setItem('players', JSON.stringify(playersToSave));
    } catch (error) {
      console.error('Error saving players:', error.message);
    }
  };

  const handleSend = () => {
    if (inputMessage.trim() === '') return;

    const newMessage = {
      _id: messages.length + 1,
      text: inputMessage.trim(),
      createdAt: new Date(),
      user: {
        _id: 1,
        name: 'Usuario',
      },
    };

    setMessages([...messages, newMessage]);
    handleBotResponse(inputMessage.trim());
    setInputMessage('');
  };

  const handleBotResponse = (message) => {
  let response = '';

  switch (message.toLowerCase()) {
    case 'crear jugador':
      setShowCreatePlayerForm(true);
      break;
    case 'compartir jugador':
      response = generatePlayerShareButtons();
      break;
    case 'eliminar jugador':
      response = 'Ingresa el nombre del jugador que deseas eliminar.';
      setPlayerToDelete(true);
      break;
    case 'consultar puntaje de jugador':
      handleConsultScore();
      break;
    case 'editar jugador':
      setEditPlayerMode(true);
      response = 'Selecciona el jugador que deseas editar.';
      break;
    default:
      if (editPlayerMode && !selectedPlayer) {
        setSelectedPlayer(message);
        const playerToEdit = players.find(player => player.name.toLowerCase() === message.toLowerCase());
        if (playerToEdit) {
          setEditedPlayerName(playerToEdit.name);
          setEditedPlayerScore(playerToEdit.score.toString());
          response = `Seleccionaste editar a ${message}. Por favor, proporciona los nuevos datos.`;
        } else {
          response = `Jugador ${message} no encontrado. Por favor, intenta de nuevo.`;
          setSelectedPlayer('');
        }
      } else if (editPlayerMode && selectedPlayer) {
        handleEditPlayer(message);
        return;
      } else if (playerToDelete) {
        deletePlayer(message);
        return;
      } else if (currentPlayer && playerPoints === null) {
        response = `¿Cuántos puntos quieres añadir a ${currentPlayer}?`;
      } else if (currentPlayer && playerPoints !== null) {
        response = `¡${playerPoints} puntos añadidos a ${currentPlayer}! ¿Quieres compartir el jugador?`;
      } else {
        response = 'Lo siento, no entendí eso. ¿En qué más puedo ayudarte?';
      }
  }

  const botResponse = {
    _id: messages.length + 2,
    text: response,
    createdAt: new Date(),
    user: {
      _id: 2,
      name: 'Bot',
    },
  };

  setMessages([...messages, botResponse]);
};

const generatePlayerShareButtons = () => {
  let shareButtons = [];
  players.forEach((player) => {
    shareButtons.push(
      <TouchableOpacity
        key={player.name}
        style={styles.shareButton}
        onPress={() => handleSharePlayer(player.name)}
      >
        <Text style={styles.shareButtonText}>Compartir {player.name}</Text>
      </TouchableOpacity>
    );
  });

  return shareButtons;
};

const handleSharePlayer = async (playerName) => {
  const playerShareLink = generateShareLink(playerName);
  try {
    const result = await Share.share({
      message: `¡Hola ${playerName}! Puedes ingresar a tu mesa de juego aquí: ${playerShareLink}`,
      url: playerShareLink,
    });
    if (result.action === Share.sharedAction) {
      if (result.activityType) {
        console.log(`Compartido con actividad: ${result.activityType}`);
      } else {
        console.log('Compartido correctamente');
      }
    } else if (result.action === Share.dismissedAction) {
      console.log('Compartir cancelado');
    }
  } catch (error) {
    console.error(error.message);
  }
};


  const deletePlayer = (playerName) => {
    const updatedPlayers = players.filter(player => player.name.toLowerCase() !== playerName.toLowerCase());
    if (updatedPlayers.length === players.length) {
      const errorMessage = `Jugador ${playerName} no encontrado. Por favor, intenta de nuevo.`;
      const errorBotResponse = {
        _id: messages.length + 2,
        text: errorMessage,
        createdAt: new Date(),
        user: {
          _id: 2,
          name: 'Bot',
        },
      };
      setMessages([...messages, errorBotResponse]);
      setPlayerToDelete(false);
    } else {
      setPlayers(updatedPlayers);
      savePlayers(updatedPlayers);
      const confirmationMessage = `¡Jugador ${playerName} fue eliminado exitosamente!`;
      const confirmationBotResponse = {
        _id: messages.length + 2,
        text: confirmationMessage,
        createdAt: new Date(),
        user: {
          _id: 2,
          name: 'Bot',
        },
      };
      setMessages([...messages, confirmationBotResponse]);
      setPlayerToDelete(false);
    }
  };

  const createPlayer = () => {
    if (newPlayerName.trim() !== '' && newPlayerScore.trim() !== '') {
      const newPlayer = { name: newPlayerName, score: parseInt(newPlayerScore) };
      setPlayers([...players, newPlayer]);
      savePlayers([...players, newPlayer]);
      setCurrentPlayer(newPlayerName);
      setPlayerPoints(newPlayerScore);
      setNewPlayerName('');
      setNewPlayerScore('');
      setShowCreatePlayerForm(false);
      const confirmationMessage = `¡Jugador ${newPlayerName} fue creado exitosamente! Ya puedes compartir la mesa de ${newPlayerName}.`;
      const confirmationBotResponse = {
        _id: messages.length + 3,
        text: confirmationMessage,
        createdAt: new Date(),
        user: {
          _id: 2,
          name: 'Bot',
        },
      };
      setMessages([...messages, confirmationBotResponse]);
    } else {
      Alert.alert('Error', 'Por favor, ingresa un nombre y un puntaje válido para el jugador.');
    }
  };

  const handleEditPlayer = (newData) => {
    const [newName, newScore] = newData.split(' ');
    const updatedPlayers = players.map((player) => {
      if (player.name.toLowerCase() === selectedPlayer.toLowerCase()) {
        return { name: newName || player.name, score: parseInt(newScore) || player.score };
      }
      return player;
    });

    setPlayers(updatedPlayers);
    savePlayers(updatedPlayers);
    setEditPlayerMode(false);
    setSelectedPlayer('');
    setEditedPlayerName('');
    setEditedPlayerScore('');

    const confirmationMessage = `¡Jugador ${selectedPlayer} fue editado exitosamente!`;
    const confirmationBotResponse = {
      _id: messages.length + 3,
      text: confirmationMessage,
      createdAt: new Date(),
      user: {
        _id: 2,
        name: 'Bot',
      },
    };
    setMessages([...messages, confirmationBotResponse]);
  };

  const generateShareLink = (playerName) => {
  let playerShareLink = '';

  // Enlaces específicos para los jugadores predeterminados
  const defaultPlayerLinks = {
    'RUPERTO': 'https://ftappgame0.onrender.com/',
    'MAECHA': 'https://ftappgame0.onrender.com/',
    'LONDOÑO': 'https://ftappgame0.onrender.com/',
    'VALDERRAMA': 'https://ftappgame0.onrender.com/',
    'RODRIGUEZ': 'https://ftappgame0.onrender.com/',
    'ATAPUMA': 'https://ftappgame0.onrender.com/'
  };

  // Verificar si el jugador es uno de los predeterminados
  if (defaultPlayerLinks.hasOwnProperty(playerName.toUpperCase())) {
    // Jugador predeterminado
    playerShareLink = defaultPlayerLinks[playerName.toUpperCase()];
  } else {
    // Jugador creado o no predeterminado
    playerShareLink = `https://ftappgame0.onrender.com/?playerName=${encodeURIComponent(playerName)}`;
  }

  console.log("Player Share Link:", playerShareLink); // Añadir este console.log para verificar el enlace generado
  
  return playerShareLink;
};




  const handleShare = async () => {
    if (currentPlayer) {
      const playerShareLink = generateShareLink(currentPlayer);
      try {
        const result = await Share.share({
          message: `¡Hola ${currentPlayer}! Puedes ingresar a tu mesa de juego aquí: ${playerShareLink}`,
          url: playerShareLink,
        });
        if (result.action === Share.sharedAction) {
          if (result.activityType) {
            console.log(`Compartido con actividad: ${result.activityType}`);
          } else {
            console.log('Compartido correctamente');
          }
        } else if (result.action === Share.dismissedAction) {
          console.log('Compartir cancelado');
        }
      } catch (error) {
        console.error(error.message);
      }
    }
  };

  const handleConsultScore = () => {
    const message = 'Por favor, ingresa el nombre del jugador cuyo puntaje deseas consultar.';
    const newMessage = createBotMessage(message);
    setMessages([...messages, newMessage]);
  };

  const handleListPlayers = () => {
    let playersList = '';
    players.forEach((player) => {
      playersList += `${player.name}: ${player.score}\n`;
    });
    const message = `Lista de jugadores:\n${playersList}`;
    const newMessage = createBotMessage(message);
    setMessages([...messages, newMessage]);
  };

  const createBotMessage = (text) => {
    return {
      _id: messages.length + 1,
      text: text,
      createdAt: new Date(),
      user: {
        _id: 2,
        name: 'Bot',
      },
    };
  };

  return (
    <View style={styles.container}>
      <ImageBackground source={require('./assets/FTAPPGAME (5).png')} style={styles.background}>
        <TouchableOpacity style={styles.backButton} onPress={onGoBack}>
          <Text style={[styles.backButtonText, { color: 'white' }]}>Volver</Text>
        </TouchableOpacity>
        <View style={styles.totalMesaContainer}>
          <Text style={styles.totalMesaText}>Total Mesas: 0</Text>
          <Text style={styles.totalMesaText}>Mesa Hoy: 1</Text>
        </View>
        <ScrollView
          ref={scrollViewRef}
          style={styles.chatContainer}
          contentContainerStyle={{ paddingBottom: 20 }}
        >
          {messages.map((message) => (
            <View key={message._id} style={styles.messageContainer}>
              <Text style={message.user._id === 1 ? styles.userMessageText : styles.botMessageText}>{message.text}</Text>
            </View>
          ))}
        </ScrollView>
        <View style={styles.buttonsContainer}>
  <TouchableOpacity style={[styles.button, { backgroundColor: '#FFA500' }]} onPress={handleClearData}>
    <Text style={styles.buttonText}>Eliminar Datos Guardados</Text>
  </TouchableOpacity>
  <View style={styles.buttonRow}>
    <TouchableOpacity style={[styles.button, { backgroundColor: '#00cc00' }]} onPress={() => setShowCreatePlayerForm(true)}>
      <Text style={styles.buttonText}>Crear Jugador</Text>
    </TouchableOpacity>
    <TouchableOpacity style={[styles.button, { backgroundColor: 'red' }]} onPress={() => handleBotResponse('eliminar jugador')}>
      <Text style={styles.buttonText}>Eliminar Jugador</Text>
    </TouchableOpacity>
  </View>
  <View style={styles.buttonRow}>
    <TouchableOpacity style={styles.button} onPress={handleListPlayers}>
      <Text style={styles.buttonText}>Lista de Jugadores</Text>
    </TouchableOpacity>
    <TouchableOpacity style={styles.button} onPress={() => handleBotResponse('editar jugador')}>
      <Text style={styles.buttonText}>Editar Jugador</Text>
    </TouchableOpacity>
  </View>
  <View style={styles.buttonRow}>
    <TouchableOpacity style={styles.button} onPress={handleConsultScore}>
      <Text style={styles.buttonText}>Consultar Puntaje de Jugador</Text>
    </TouchableOpacity>
    <TouchableOpacity style={[styles.button, { backgroundColor: '#FFA500' }]} onPress={() => handleBotResponse('compartir jugador')}>
      <Text style={styles.buttonText}>Compartir Jugador</Text>
    </TouchableOpacity>
  </View>
</View>

        {currentPlayer && playerPoints !== null && (
          <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
            <Text style={styles.shareButtonText}>Compartir Jugador</Text>
          </TouchableOpacity>
        )}
        {showCreatePlayerForm && (
          <View style={styles.createPlayerForm}>
            <TextInput
              style={styles.input}
              value={newPlayerName}
              onChangeText={(text) => setNewPlayerName(text)}
              placeholder="Nombre del jugador"
            />
            <TextInput
              style={styles.input}
              value={newPlayerScore}
              onChangeText={(text) => setNewPlayerScore(text)}
              placeholder="Puntaje inicial"
              keyboardType="numeric"
            />
            <TouchableOpacity style={styles.createButton} onPress={createPlayer}>
              <Text style={styles.createButtonText}>Crear</Text>
            </TouchableOpacity>
          </View>
        )}
        {editPlayerMode && selectedPlayer && (
          <View style={styles.editPlayerForm}>
            <Text style={styles.editPlayerTitle}>Editando Jugador: {selectedPlayer}</Text>
            <TextInput
              style={styles.input}
              value={editedPlayerName}
              onChangeText={setEditedPlayerName}
              placeholder="Nuevo nombre del jugador"
            />
            <TextInput
              style={styles.input}
              value={editedPlayerScore}
              onChangeText={setEditedPlayerScore}
              placeholder="Nuevo puntaje del jugador"
              keyboardType="numeric"
            />
            <TouchableOpacity style={styles.createButton} onPress={() => handleEditPlayer(`${editedPlayerName} ${editedPlayerScore}`)}>
              <Text style={styles.createButtonText}>Guardar Cambios</Text>
            </TouchableOpacity>
          </View>
        )}
        <View style={styles.inputContainer}>
          <TextInput
            style={[styles.input, { color: 'white' }]}
            value={inputMessage}
            onChangeText={(text) => setInputMessage(text)}
            placeholder="Escribe un mensaje..."
            placeholderTextColor="white"
          />
          <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
            <Text style={styles.sendButtonText}>Enviar</Text>
          </TouchableOpacity>
        </View>
      </ImageBackground>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    flex: 1,
    resizeMode: "cover",
    justifyContent: "center"
  },
  backButton: {
    position: 'absolute',
    top: 80,
    right: 20,
    backgroundColor: 'red',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  backButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  totalMesaContainer: {
    position: 'absolute',
    top: 80,
    left: 20,
  },
  totalMesaText: {
    color: 'white',
    fontWeight: 'bold',
    marginBottom: 5,
  },
  chatContainer: {
    flex: 1,
    marginTop: 120,
  },
  messageContainer: {
    backgroundColor: 'blue',
    borderRadius: 10,
    padding: 10,
    marginVertical: 5,
    marginHorizontal: 10,
    maxWidth: '80%',
    alignSelf: 'flex-start',
  },
  userMessageText: {
    color: 'black',
  },
  botMessageText: {
    color: 'white',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: '#ccc',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginRight: 10,
  },
  sendButton: {
    backgroundColor: 'blue',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 5,
  },
  sendButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  shareButton: {
    alignSelf: 'center',
    backgroundColor: 'green',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    marginTop: 10,
  },
  shareButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  createPlayerForm: {
    backgroundColor: '#fff',
    borderRadius: 5,
    padding: 10,
    marginVertical: 200,
    marginHorizontal: 10,
    maxWidth: '80%',
    alignSelf: 'flex-start',
  },
  createButton: {
    backgroundColor: 'blue',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 5,
    marginTop: 10,
    alignSelf: 'flex-start',
  },
  createButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  buttonsContainer: {
    marginTop: 10,
    alignItems: 'center',
  },
 buttonRow: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  marginBottom: 5,
  marginTop: 6, // Añade un marginTop para separar los grupos de botones
},

  button: {
    backgroundColor: 'blue',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    width: '48%',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  editPlayerForm: {
    backgroundColor: '#fff',
    borderRadius: 5,
    padding: 10,
    marginVertical: 200,
    marginHorizontal: 10,
    maxWidth: '80%',
    alignSelf: 'flex-start',
  },
  editPlayerTitle: {
    color: 'black',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
});

export default StatsScreen;
