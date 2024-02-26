import Header from "./Header"
import Main from "./Main"
import Loader from "./Loader"
import Error from "./Error"
import { useEffect, useReducer } from "react";
import StartScreen from "./StartScreen";
import Questions from "./Questions";
import NextButton from "./NextButton";
import Progress from "./Progress";
import FinishedScreen from "./FinishedScreen";
import Footer from "./Footer"
import Timer from "./Timer";

const SECS_PER_QUEST = 30;

const initialSate = {
  questions: [],
  // 'loading', 'error', 'ready', 'active', 'finished'
  //  Những trạng thái của Status
  status: 'loading',
  index: 0,
  // To loading a single question
  answer: null,
  points: 0,
  highscore: 0,
  secondsRemaining: null,
};

function reducer(state, action) {
  switch (action.type) {
    case "dataReceived":
      return {
        ...state,
        questions: action.payload,
        status: "ready"
      }
    case "dataFailed":
      return {
        ...state,
        status: "error",
      }
    case "start":
      return {
        ...state,
        status: "active",
        secondsRemaining: state.questions.length * SECS_PER_QUEST,
      }
    case "newAnswer":
      const question = state.questions.at(state.index);
      // Lấy ra question đang được chọn trong data
      return {
        ...state,
        answer: action.payload,
        points:
          action.payload === question.correctOption
            ? state.points + question.points
            : state.points,
      }
    case "nextQuestion":
      return {
        ...state,
        index: state.index + 1,
        answer: null,
      }
    case "finish":
      return {
        ...state,
        status: "finished",
        highscore:
          state.points > state.highscore
            ? state.points
            : state.highscore,
      }
    case "restart":
      return {
        ...initialSate,
        questions: state.questions,
        status: "ready"
      }
    // Hai cách viết tượng tự nhưng cách viết một gọn hơn và trực quan hơn

    // return {
    //   ...state,
    //   status: "ready",
    //   answer: null,
    //   index: 0,
    //   points: 0,
    //   highscore:
    //     state.points > state.highscore
    //       ? state.points
    //       : state.highscore,
    // }

    case "tick":
      return {
        ...state,
        secondsRemaining: state.secondsRemaining - 1,
        status: state.secondsRemaining === 0 ? 'finished' : state.status
      }
    default:
      throw new Error("Action Unknown");
  }
}

export default function App() {
  const [{ questions, status, index, answer, points, highscore, secondsRemaining }, dispatch] = useReducer(reducer, initialSate);

  const numQuestions = questions.length;
  const maxPosiblePoints = questions.reduce((prev, cur) => prev + cur.points, 0)

  useEffect(function () {
    fetch("http://localhost:8000/questions ")
      .then(res => res.json())
      .then(data => dispatch({ type: "dataReceived", payload: data }))
      .catch(err => dispatch({ type: 'dataFailed' }));
  }, [])


  return (
    <div className="app">
      <Header />
      <Main>
        {status === 'loading' && <Loader />}
        {status === 'error' && <Error />}
        {status === 'ready' && <StartScreen numQuestions={numQuestions} dispatch={dispatch} />}
        {status === 'active' &&
          (<>
            <Progress
              index={index}
              numQuestions={numQuestions}
              points={points}
              maxPosiblePoints={maxPosiblePoints}
              answer={answer}
            />
            <Questions
              questions={questions[index]}
              dispatch={dispatch}
              answer={answer}
            />
            <Footer >
              <Timer dispatch={dispatch} secondsRemaining={secondsRemaining} />
              <NextButton
                dispatch={dispatch}
                answer={answer}
                numQuestions={numQuestions}
                index={index}
              />
            </Footer>
          </>)
        }
        {status === 'finished' &&
          <FinishedScreen
            points={points}
            maxPossiblePoints={maxPosiblePoints}
            highscore={highscore}
            dispatch={dispatch}
          />}
      </Main>
    </div>
  )
}