import './index.css'
import React from 'react'
import ReactDOM from 'react-dom/client'
import { Layout } from './pages/Layout'
import { RouterProvider, createBrowserRouter } from 'react-router-dom'
import { About } from './pages/About'
import { GroupList } from './pages/GroupList'
import { GroupEdit } from './pages/GroupEdit'
import { Group } from './pages/Group'
import { ExpenseList } from './pages/ExpenseList'
import { ExpenseEdit } from './pages/ExpenseEdit'
import { Balance } from './pages/Balance'
import { RootBoundary } from './pages/RootErrorBoundary'

// TODO:
// - Add export menu item on card
// - Get rid of menu on group card and replace it with icons
// - Different dedign for the new card


const router = createBrowserRouter([
  {
    element: <Layout />, errorElement: <RootBoundary />,
    children: [
      { index: true, element: <GroupList />},
      { path: '/', element: <GroupList /> },
      { path: '/about', element: <About /> },
      { path: '/create', element: <GroupEdit />, id: 'create'},
      { path: ':groupId', element: <Group />, children: [
        { index: true, element: <ExpenseList />, handle: "expenses"},
        { path: 'expenses', element: <ExpenseList />, handle: "expenses" },
        { path: 'expenses/create', element: <ExpenseEdit /> },
        { path: 'expenses/:expenseId/edit', element: <ExpenseEdit />  },
        { path: 'edit', element: <GroupEdit />, handle: "edit" },
        { path: 'balance', element: <Balance />, handle: "balance" },
      ]},
    ],
  },
]);


ReactDOM
  .createRoot(document.getElementById('root')!)
  .render(
    <React.StrictMode>
        <RouterProvider router={router} />
    </React.StrictMode>,
)
