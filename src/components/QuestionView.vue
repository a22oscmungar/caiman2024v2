<template>
  <div class="question-view">
    <div v-if="username === 'admin'" class="player-info">
      <div v-for="(player, index) in players" :key="index" class="player-details">
        <p>{{ player.nombre }}</p>
      </div>
    </div>
    
    <img src="../assets/logowaiting.png" alt="Caimán" width="150" height="150">

    <div v-if="username === 'admin'" class="question-section">
      <div class="enunciado">
        <p>{{ currentQuestion.question }}</p>
      </div>  
      <div class="option-grid">
        <div v-for="(option, index) in currentQuestion.options" :key="index"
          :class="['option', getOptionClass(index), { selected: selectedOption === index }]"
          @click="selectOption(index)">
          {{ option }}
        </div>
      </div>
      <button class="resolve-button" @click="resolver()">RESOLVER</button>
      <button class="next-button" @click="next()">SIGUIENTE PREGUNTA</button>
    </div>

    <div v-else class="player-buttons">
      <div class="preguntaUsuario">
        <p>{{ currentQuestion.question }}</p>
      </div>
      <div class="button-grid">
        <button v-for="(option, index) in currentQuestion.options" :key="index"
          @click="selectOption(index)"
          :class="['option', getOptionClass(index), { selected: selectedOption === index }]">
          Opción {{ index + 1 }}
        </button>
      </div>
    </div>
  </div>
</template>


<script>
import { io } from 'socket.io-client';

export default {
  data() {
    return {
      playerName: '',
      playerImage: '',
      questionText: '',
      options: [],
      selectedOption: null,
      username: '',
      questions: [],
      currentQuestionIndex: 0,
      loading: true,
      error: null,
      players: [], // Array para almacenar los jugadores conectados
      logo: '../assets/logowaiting.png',
      currentQuestion: { question: '', options: [], correctAnswer: 0},
    };
  },
  async created() {
    this.username = this.$route.query.username; // Obtener el nombre de usuario de la ruta

    this.socket = io(); // Conectar al servidor
    this.socket.on('newQuestion', (question) => {
      this.currentQuestion = question;
    });

    try {
      const response = await fetch('http://localhost:8000/getQuestionsKahoot');
      if (!response.ok) {
        throw new Error(`Error del servidor: ${response.statusText}`);
      }
      const data = await response.json();
      this.questions = data.questions;
      
      this.currentQuestion = this.questions[this.currentQuestionIndex];
    } catch (err) {
      console.error('Error al cargar las preguntas:', err);
      this.error = 'Error al cargar las preguntas';
      this.loading = false;
    }

    try {
      const response = await fetch('http://localhost:8000/connected-players');
      if (!response.ok) {
        throw new Error(`Error del servidor: ${response.statusText}`);
      }
      const data = await response.json();
      this.players = data.players; // Asignar correctamente los jugadores recibidos
    } catch (err) {
      console.error('Error al cargar los jugadores:', err);
      this.error = 'Error al cargar los jugadores';
      this.loading = false;
    }
  },
  methods: {
    selectOption(index) {
      this.selectedOption = index;
    },
    next() {
      this.currentQuestionIndex++;
      this.currentQuestion = this.questions[this.currentQuestionIndex];
      this.selectedOption = null;
      this.socket.emit('nextQuestion', this.currentQuestion);

      // Limpiar las clases de las opciones
      const options = document.getElementsByClassName('option');
      for (let i = 0; i < options.length; i++) {
        options[i].classList.remove('opcion-correcta');
        options[i].classList.remove('opcion-incorrecta');
      }
    },
    async submitAnswer() {
      if (this.selectedOption === null) {
        alert('Por favor selecciona una respuesta.');
        return;
      }

      try {
        const response = await fetch('/submit-answer', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ player: this.playerName, answer: this.options[this.selectedOption] }),
        });

        const data = await response.json();
        alert(data.message);
      } catch (err) {
        console.error('Error al enviar la respuesta:', err);
      }
    },

    getOptionClass(index) {
      const colors = ['blue', 'green', 'orange', 'yellow'];
      return colors[index] || '';
    },
    resolver(){
      // haremos que cuando el admin presione el botón de resolver, la opcion de la respuesta correcta se pinte de verde y el resto de rojo

      // recorremos las opciones
      console.log('currentQuestion', this.currentQuestion);
      
      this.currentQuestion.options.forEach((option, index) => {
        // si la opcion es la correcta
        
        console.log('opcion ', index, ' es correcta? ', (index+1) === this.currentQuestion.correctAnswer, " correcta: ", this.currentQuestion.correctAnswer);
        if ((index+1) === this.currentQuestion.correctAnswer) {
          // pintamos la opcion de verde
          document.getElementsByClassName('option')[index].classList.add('opcion-correcta');
          
          
        } else {
          // pintamos el resto de opciones de rojo
          document.getElementsByClassName('option')[index].classList.add('opcion-incorrecta');
        }
      });
     
        
      



    }
  },
};
</script>


<style scoped>
.question-view {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  background-color: antiquewhite;
  height: 100vh;
  padding: 1rem;
  overflow: hidden;
}

.player-info {
  display: flex;
  align-items: center;
}

.player-info img {
  width: 50px;
  height: 50px;
  margin-right: 10px;
  border-radius: 50%;
}

.question-section {
  background-color: white;
  padding: 80px;
  border-radius: 10px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  width: 50%;
  align-items: center;
  text-align: center;
  overflow: hidden;
}

.option-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  width: 100%;
  margin: 20px 0;
}

.option {
  padding: 20px;
  border: 1px solid #ccc;
  cursor: pointer;
  border-radius: 5px;
  text-align: center;
  color: white;
  font-size: 1rem;
  font-weight: bold;
}

.blue {
  background-color: #007bff;
}

.green {
  background-color: #28a745;
}

.orange {
  background-color: #c48614;
}

.yellow {
  background-color: purple;
}

.action-button {
  background-color: #6c757d;
  border: none;
  color: white;
  padding: 10px;
  margin: 10px 0;
  cursor: pointer;
  border-radius: 5px;
  width: 100%;
  font-size: 1rem;
  font-weight: bold;
  text-align: center;
}

.action-button:hover {
  background-color: #5a6268;
}

.preguntaUsuario {
  background-color: ghostwhite;
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  width: 50%;
  align-items: center;
  text-align: center;
}

.player-buttons {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 1rem;
}

.button-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 25px;
  margin: 0;
  margin-top: 20%;
}

button {
  padding: 50px;
  border-radius: 5px;
  cursor: pointer;
  color: white;
  border: none;
  transition: background-color 0.3s;
}

.button-grid button:nth-child(1) {
  background-color: #007bff; /* Azul */
}

.button-grid button:nth-child(2) {
  background-color: #28a745; /* Verde */
}

.button-grid button:nth-child(3) {
  background-color: #dc3545; /* Rojo */
}

.button-grid button:nth-child(4) {
  background-color: purple; /* Amarillo */
}

.resolve-button {
  background-color: grey;
  border: none;
  color: white;
  padding: 10px;
  margin: 10px 0;
  cursor: pointer;
  border-radius: 5px;
  width: 100%;
  font-size: 1rem;
  font-weight: bold;
  text-align: center;
  
}

.next-button {
  background-color: grey;
  border: none;
  color: white;
  padding: 10px;
  margin: 10px 0;
  cursor: pointer;
  border-radius: 5px;
  width: 100%;
  font-size: 1rem;
  font-weight: bold;
  text-align: center;
}

.resolve-button:hover, .next-button:hover {
  background-color: green;
}

.opcion-correcta {
  background-color: green;
}

.opcion-incorrecta {
  background-color: red;
}


</style>