import { useEffect, useState } from 'react';
import { API } from 'aws-amplify';
import { Alert, Authenticator, Divider, Menu, MenuItem, useAuthenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';

type Item = { title: string; authors: string[]; authorsStr: string; previewLink: string; publishedDate: string };

function App() {
  const { authStatus } = useAuthenticator((context) => [context.authStatus]);
  const { user, signOut } = useAuthenticator((context) => [context.user]);
  const [email, setEmail] = useState<string>('');
  const [items, setItems] = useState<Item[]>([]);
  const [date, setDate] = useState<Date>();
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    if (authStatus === 'authenticated' && user) {
      setEmail(user.attributes?.email ?? '');
      retrieveItems();
    }
  }, [authStatus, user]);

  async function retrieveItems() {
    try {
      const response = (await API.get('restApi', 'items', {})) as Item[];
      setDate(new Date(Date.now()));
      setItems(response);
    } catch (error) {
      console.error(JSON.stringify(error));
      if (error instanceof Error) {
        setErrorMessage(error.message);
      }
    }
  }

  function MenuComponent(): JSX.Element {
    return (
      <Menu menuAlign="end">
        <div className="summary">
          <div>{email}</div>
        </div>
        <Divider />
        <MenuItem onClick={signOut}>Sign Out</MenuItem>
      </Menu>
    );
  }

  function TableComponent({ items }: { items: Item[] }): JSX.Element {
    return items.length > 0 ? (
      <table>
        <thead>
          <tr>
            <th>Book title</th>
            <th>Preview</th>
            <th>Published</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => (
            <tr key={index}>
              <td>{item.title}</td>
              <td>
                <a href={item.previewLink} target="_blank">
                  Link
                </a>
              </td>
              <td>{item.publishedDate}</td>
            </tr>
          ))}
        </tbody>
      </table>
    ) : (
      <></>
    );
  }

  return (
    <>
      {authStatus !== 'authenticated' ? (
        <div className="auth-container">
          <Authenticator hideSignUp={true} loginMechanisms={['email']} />
        </div>
      ) : (
        <main>
          <div className="menu-container">
            <MenuComponent />
          </div>
          <h1>Books related to AWS Amplify</h1>
          <div className="date-text">Retrieved at: {date?.toLocaleString()}</div>
          <div className="table-container">
            <TableComponent items={items} />
            {errorMessage && (
              <Alert variation="error" isDismissible={false} hasIcon={true} heading="Error">
                {errorMessage}
              </Alert>
            )}
          </div>
        </main>
      )}
    </>
  );
}

export default App;
