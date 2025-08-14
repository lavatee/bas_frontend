import { useEffect, useRef, useState } from 'react';
import './App.css';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom'
import { MdKeyboardVoice } from "react-icons/md";
import { GoDotFill } from "react-icons/go";
import { IoStop } from "react-icons/io5";
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route exact path='/' element={<AIChat/>}/>
      </Routes>
    </BrowserRouter>
  );
}

export default App;

function AIChat() {
  const [transcript, setTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);
  const [lastMessagesLen, setLastMessagesLen] = useState(0)
  const [messages, setMessages] = useState([{isUserMessage: false, text: "Привет, я твой ИИ-Помощник"}])
  const [isLoading, setIsLoading] = useState(false)
  const [userDevice, setUserDevice] = useState("desktop")
  const [voices, setVoices] = useState([])
  useEffect(() => {
    if (lastMessagesLen < messages?.length) {
      console.log(messages[messages?.length - 1])
      let target = document.getElementById(`${messages?.length - 1}`)
      target.scrollIntoView({ behavior: "smooth", block: "center" });
      target.classList.add("show")
      if (messages?.length > 1) {
        let target = document.getElementById(`${messages?.length - 2}`)
        target.scrollIntoView({ behavior: "smooth", block: "center" });
        target.classList.add("show")
      }
      setLastMessagesLen(messages?.length)
    }
    
  }, [messages])
  const checkScreenWidth = () => {
    if (window.innerWidth < 650) {
        setUserDevice("phone");
    } else {
        setUserDevice("desktop");
    }
  };
  useEffect(() => {
    const fetchVoices = () => {
      const availableVoices = speechSynthesis.getVoices();
      setVoices(availableVoices);
    };
    console.log(voices)
    fetchVoices();
    speechSynthesis.onvoiceschanged = fetchVoices;
  }, []);

  useEffect(() => {
    checkScreenWidth();
    window.addEventListener("resize", checkScreenWidth);
    return () => {
        window.removeEventListener("resize", checkScreenWidth);
    };
  }, []);
  useEffect(() => {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        alert('Ваш браузер не поддерживает распознавание речи');
         return;
      }

      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'ru-RU';

      recognitionRef.current.onresult = (event) => {
        const currentTranscript = Array.from(event.results)
          .map(result => result[0].transcript)
            .join('');
        setTranscript(currentTranscript);
      };

      recognitionRef.current.onend = () => {
        if (isListening) {
          recognitionRef.current.start();
        }
      };
  }, [isListening]);

  const startListening = () => {
     setIsListening(true);
     recognitionRef.current.start();
  };

  const stopListening = () => {
    setIsListening(false);
    recognitionRef.current.stop();
  };
  const sendMessage = async() => {
    
    setMessages(prevMessages => [
      ...prevMessages, 
      {isUserMessage: true, text: transcript}
    ]);
    setMessages(prevMessages => [
      ...prevMessages, 
      { isUserMessage: false, text: "" }
    ]);
    const botMessageIndex = messages.length;
    const trans = transcript
    setTranscript("")
    const answer = await fetchAIApi(trans)
    
    let index = 0;
    console.log(answer)
    speak(answer)
    
    const timeout = setTimeout(function type() {
      setIsLoading(false)
      let count = 0
      setMessages(prevMessages => {
          const newMessages = [...prevMessages];
          if (count == 0) {
            newMessages[botMessageIndex + 1].text += answer.charAt(index);
          }
          
          count++
          return newMessages;
      });
      
      index++;

      if (index < answer.length) {
          setTimeout(type, 20);
      } else {
        clearTimeout(timeout)
      }
  }, 50)
    
  }

  async function speak(text) {
    console.log(speechSynthesis.getVoices())
    const utterance = new SpeechSynthesisUtterance(text);
    const pavelVoice = voices.find(voice => voice.name === "Microsoft Pavel - Russian (Russia)");
    if (pavelVoice) {
        utterance.voice = pavelVoice;
    }
    
    speechSynthesis.speak(utterance);
  }
 
  return (
      <>
      <div className='header'>
        <h1>ИИ-Ассистент</h1>
      </div>
      <div style={{display: "flex", flexDirection: "row", width: "100vw", height: "100%"}}>
          <ul style={{width: userDevice == "phone" ? "100vw" : "40vw", background: "none", height: "100%", margin: 0, padding: 0, marginTop: "10vh", minHeight: "100vh", borderColor: "black", borderRight: "solid", borderRightWidth: "2px", paddingTop: "5vh", marginBottom: userDevice == "phone" ? "26vh" : "0"}}>
        

            {
              messages.map((message, i) => (
                <div style={{display: "flex", flexDirection: "row"}}>
                  <li id={`${i}`} className={((message.isUserMessage ? "userMessage" : "botMessage") + " " + "fade-in")}>
                    {
                      isLoading && !message.isUserMessage && i == messages.length - 1 ?
                      <div className='loader'>
                        <h3 className='dot'>.</h3>
                        <h3 className='dot'>.</h3>
                        <h3 className='dot'>.</h3>
                      </div>
                      : <h4>{message.text}</h4>
                    }
                    
                  </li>
                  {
                    isLoading && !message.isUserMessage && i == messages.length - 1 ?
                    <p style={{color: "#999999", marginLeft: "10px"}}>Думаю...</p>
                    : ""
                  }
                </div>
                
              ))
            }
          </ul>
          <div style={{width: userDevice == "phone" ? "100vw" : "60vw", display: "grid", position: "fixed", left: userDevice == "phone" ? "0" : "40vw", minHeight: userDevice == "phone" ? "25vh" : "100%", placeItems: "center", alignContent: "center", top: userDevice == "phone" ? "75vh" : "", zIndex: 990, borderTop: userDevice == "phone" ? "solid 2px" : "", backgroundColor: "#DDDCDA", background: userDevice == "desktop" ? "none" : ""}}>
            {userDevice == "phone" ? "" : <h1 style={{fontWeight: 500, letterSpacing: "1px"}}>Задайте свой вопрос ИИ-помощнику</h1>}
            <h2 style={{textAlign: "center", marginTop: userDevice == "phone" ? "1vh" : "8vh"}}>{transcript} {isListening ? <><GoDotFill className='dot'/><GoDotFill className='dot'/><GoDotFill className='dot'/></> : ""}</h2>
            <div style={{display: "flex", justifyContent: "center", flexWrap: "wrap"}}>
              
              
              {
                !isListening && transcript?.length > 0 ?
                <div style={{display: "flex", flexDirection: "row"}}>
                  <button style={{padding: 15, borderRadius: "10px"}} onClick={() => {setIsLoading(true); sendMessage()}}>Отправить</button>
                  <button style={{padding: 15, marginLeft: "5px", borderRadius: "10px"}} onClick={() => {setTranscript(""); stopListening();}}>Отмена</button>
                </div>
                :
                <button style={{borderRadius: 120, marginBottom: userDevice == "phone" ? "2vh" : ""}} onClick={isListening ? () => {stopListening()} : startListening}>
                  {isListening ? <IoStop style={{fontSize: userDevice == "phone" ? "100" : "200", color: "#999999"}}/> : <MdKeyboardVoice style={{fontSize: userDevice == "phone" ? "100" : "200", color: "white"}}/>}
                </button>
              }
            </div>
            
            <textarea placeholder='Сообщение' value={transcript} onChange={(e) => setTranscript(e.target.value)} style={{marginTop: "10px"}}/>
            
          </div>
      </div>
      </>
  );
}

async function fetchAIApi(query) {
  const response = await fetch("/api/question", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({question: query})
  });
  const data = await response.json()
  return data?.content
}