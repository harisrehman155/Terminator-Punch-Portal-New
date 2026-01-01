import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { PersistGate } from 'redux-persist/integration/react'
import { Store, Persister } from './redux/Store'
import { initializeAuth } from './redux/actions/AuthAction'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Provider store={Store}>
      <PersistGate
        loading={null}
        persistor={Persister}
        onBeforeLift={() => {
          // Initialize auth state from localStorage after Redux Persist has loaded
          Store.dispatch(initializeAuth());
        }}
      >
        <App />
      </PersistGate>
    </Provider>
  </StrictMode>,
)
