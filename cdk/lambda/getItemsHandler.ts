import { APIGatewayProxyHandler, Context } from 'aws-lambda';

type Book = {
  title: string;
  authors: string[];
  previewLink: string;
};

type GoogleBook = {
  volumeInfo: { title: string; authors?: string[]; previewLink: string; publishedDate: string };
};

export const handler: APIGatewayProxyHandler = async (event: unknown, context: Context) => {
  console.debug(`${context.functionName}:request data`, { event, context });
  const response = await fetch('https://www.googleapis.com/books/v1/volumes?q=aws+amplify&maxResults=20');
  const json = await response.json();
  const items = json.items.map((item: GoogleBook) => {
    return {
      title: item.volumeInfo.title,
      authors: item.volumeInfo.authors ?? [],
      previewLink: item.volumeInfo.previewLink,
      publishedDate: item.volumeInfo.publishedDate,
    } as Book;
  });
  return {
    statusCode: 200,
    body: JSON.stringify(items),
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }, //TODO: Don't use in production
  };
};
