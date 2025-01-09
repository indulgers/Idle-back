import axios from 'axios';

import { CUSTOM_RAW_GPT_URL } from '@/config';

const systemPrompt =
  'You are a tool to find similar scenery descriptions among candidate scenery descriptions, given a target scenery description. Only return the index of the most similar candidate, or -1 if there is no similar one.';

export async function findMostSimilarity(historyPrompts, prompt) {
  const query = [
    'Given a set of existing candidates for scenery descriptions and a target scenery description, your task is to find the most similar one (describing roughly the same scenery) from the candidates and return its index.',
    'If all of the candidates are dissimilar (describing a totally different scenery) to the target, return {"index": -1}.',
    'Please notice return only the index in JSON format.',
    '',
    `The candidates are: ${JSON.stringify(historyPrompts)}`,
    `The target is: ${prompt}`,
  ];

  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: query.join('') },
  ];
  const res = await axios.post(CUSTOM_RAW_GPT_URL, {
    model: 'gpt-3.5-turbo-0125',
    temperature: 0,
    max_tokens: 32,
    response_format: { type: 'json_object' },
    messages: messages,
  });
  return res.data || '';
}
