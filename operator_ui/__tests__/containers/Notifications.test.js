/* eslint-disable react/display-name */
import React from 'react'
import { Provider } from 'react-redux'
import { MemoryRouter } from 'react-router'
import { mount } from 'enzyme'
import configureStore from 'redux-mock-store'
import Notifications from 'containers/Notifications'

const classes = {}
const mockStore = configureStore()

const mountNotifications = store =>
  mount(
    <Provider store={store}>
      <MemoryRouter>
        <Notifications classes={classes} />
      </MemoryRouter>
    </Provider>
  )

describe('containers/Notifications', () => {
  it('renders success and error components', () => {
    const successes = [
      {
        component: ({ msg }) => <span>Success {msg}</span>,
        props: { msg: '1' }
      }
    ]
    const errors = [
      { component: ({ msg }) => <span>Error {msg}</span>, props: { msg: '2' } }
    ]
    const state = {
      notifications: {
        successes: successes,
        errors: errors,
        currentUrl: null
      }
    }
    const store = mockStore(state)
    let wrapper = mountNotifications(store)

    expect(wrapper.text()).toContain('Success 1')
    expect(wrapper.text()).toContain('Error 2')
  })

  it('renders an unhandled error message when there is no component', () => {
    const state = {
      notifications: {
        successes: [],
        errors: [{}],
        currentUrl: null
      }
    }
    const store = mockStore(state)
    let wrapper = mountNotifications(store)

    expect(wrapper.text()).toContain(
      'Unhandled error. Please help us by opening a bug report'
    )
  })
})
