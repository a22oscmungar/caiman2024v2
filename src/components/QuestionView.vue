<template>
  <div class="question-view">
    <div class="player-info">
      <p>{{ username }}</p>
    </div>

    <div v-if="username === 'admin'" class="question-section">
      <p>{{ this.currentQuestion.question }}</p>
      <div
        v-for="(option, index) in this.currentQuestion.options"
        :key="index"
        :class="['option', { selected: selectedOption === index }]"
        @click="selectOption(index)"
      >
        {{ option }}
        
      </div>
      
      <button @click="next()"> SIGUIENTE PREGUNTA</button>

    </div>

    <div v-else class="player-buttons">
      <p>{{ this.currentQuestion.question }}</p>
      <div class="button-grid">
        <button
          v-for="(option, index) in this.currentQuestion.options"
          :key="index"
          @click="selectOption(index)"
          :class="{ selected: selectedOption === index }"
        >
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
      currentQuestion: { question: '', options: [] },
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
      console.log('Preguntas recibidas');
      
      

      const data = await response.json(); // Aquí parsea el JSON correctamente
      this.questions = data.questions;
      console.log('Preguntas:', this.questions);  
      
      this.currentQuestion = this.questions[this.currentQuestionIndex];

    } catch (err) {
      console.error('Error al cargar las preguntas:', err);
      this.error = 'Error al cargar las preguntas';
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
  },
};
</script>

<style scoped>
.question-view {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
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
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  width: 50%;
  align-items: center;
  text-align: center;
}

.option {
  margin: 10px 0;
  padding: 10px;
  background-color: #f0f0f0;
  border: 1px solid #ccc;
  cursor: pointer;
  border-radius: 5px;
  text-align: center;
}

.option.selected {
  background-color: #d0e1f9;
  border-color: #007bff;
}

.player-buttons {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.button-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

button {
  padding: 10px;
  border-radius: 5px;
  cursor: pointer;
  background-color: #4CAF50;
  color: white;
  border: none;
  transition: background-color 0.3s;
}

button:hover {
  background-color: #45a049;
}
</style>
