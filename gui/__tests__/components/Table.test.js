import React from 'react'
import { render } from 'enzyme'
import Table from 'components/Table'

describe('components/Table', () => {
  describe('headers', () => {
    it('renders from text', () => {
      let wrapper = render(<Table cols={['ColA', 'ColB']} />)
      expect(wrapper.text()).toContain('ColA')
      expect(wrapper.text()).toContain('ColB')
    })

    it('can render the name attr from an object', () => {
      let wrapper = render(<Table cols={['ColA', {name: 'NameCol'}]} />)
      expect(wrapper.text()).toContain('ColA')
      expect(wrapper.text()).toContain('NameCol')
    })
  })

  it('renders each column in the row', () => {
    let wrapper = render(<Table
      cols={[]}
      rows={[
        ['Row1ColA', 'Row1ColB'],
        ['Row2ColA', 'Row2ColB']
      ]}
    />)
    expect(wrapper.text()).toContain('Row1ColA')
    expect(wrapper.text()).toContain('Row1ColB')
    expect(wrapper.text()).toContain('Row2ColA')
    expect(wrapper.text()).toContain('Row2ColB')
  })

  it('can render formatted columns', () => {
    let wrapper = render(<Table
      cols={[
        {name: 'ID', type: 'link'},
        {name: 'Created At', type: 'datetimeRelative'}
      ]}
      rows={[['abc123', '2018']]}
    />)
    expect(wrapper.text()).toContain('abc123')
    expect(wrapper.text()).toContain('seconds ago')
  })

  it('renders a loading message when rows are falsey', () => {
    let wrapper = render(<Table cols={[]} />)
    expect(wrapper.text()).toContain('Loading...')
  })

  it('renders an empty message when there are no rows', () => {
    let wrapper = render(<Table cols={[]} rows={[]} />)
    expect(wrapper.text()).toContain('There are no records')
  })
})
