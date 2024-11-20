import { createRouter, createWebHistory } from 'vue-router';
import LoginView from '../components/LoginView.vue';
import WaitingRoom from '../components/WaitingRoom.vue';
import QuestionView from '../components/QuestionView.vue';
import TriviaRoom from '../components/TriviaRoom.vue';
import Resultados from '../components/ResultadosCmp.vue';

const routes = [
    { path: '/', component: LoginView },
    { path: '/waiting-room', component: WaitingRoom },
    { path: '/question', component: QuestionView },
    { path: '/question-view', component: QuestionView },
    { path: '/trivia-room', component: TriviaRoom, name: 'trivia-room' },
    { path: '/resultados', component: Resultados, name: 'resultados' },
];

const router = createRouter({
    history: createWebHistory(),
    routes,
});

export default router;
