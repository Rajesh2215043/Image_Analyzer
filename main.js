import { GoogleGenerativeAI, HarmBlockThreshold, HarmCategory } from "@google/generative-ai";
import Base64 from 'base64-js';
import MarkdownIt from 'markdown-it';
import { maybeShowApiKeyBanner } from './gemini-api-banner';
import './style.css';
let API_KEY = 'AIzaSyDG9cSXkKgMqDW1QiRBIem2AhGGPexRORA';

let form = document.querySelector('form');
let promptInput = document.querySelector('input[name="prompt"]');
let output = document.querySelector('.output');

form.onsubmit = async (ev) => {
  ev.preventDefault();
  output.textContent = 'Generating...';

  try {
    const fileInput=document.getElementById('fileInput');
    const file=fileInput.files[0];
    const imageBase64= await new Promise((resolve,reject)=>{
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload=()=>{
        const base64String = reader.result.split(',')[1];
        resolve(base64String);
      };
      reader.onerror=reject;
    })
    let contents = [
      {
        role: 'user',
        parts: [
          { inline_data: { mime_type: 'image/jpeg', data: imageBase64, } },
          { text: promptInput.value }
        ]
      }
    ];
    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      safetySettings: [
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
        },
      ],
    });

    const result = await model.generateContentStream({ contents });

    let buffer = [];
    let md = new MarkdownIt();
    for await (let response of result.stream) {
      buffer.push(response.text());
      output.innerHTML = md.render(buffer.join(''));
    }
  } catch (e) {
    output.innerHTML += '<hr>' + e;
  }
};

maybeShowApiKeyBanner(API_KEY);