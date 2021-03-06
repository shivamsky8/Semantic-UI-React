import _ from 'lodash'
import React from 'react'

import Portal from 'src/addons/Portal/Portal'
import { SUI } from 'src/lib'
import Popup, { POSITIONS } from 'src/modules/Popup/Popup'
import PopupHeader from 'src/modules/Popup/PopupHeader'
import PopupContent from 'src/modules/Popup/PopupContent'
import * as common from 'test/specs/commonTests'
import { domEvent, sandbox } from 'test/utils'

// ----------------------------------------
// Wrapper
// ----------------------------------------
let wrapper

// we need to unmount the Popup after every test to remove it from the document
// wrap the render methods to update a global wrapper that is unmounted after each test
const wrapperMount = (...args) => (wrapper = mount(...args))
const wrapperShallow = (...args) => (wrapper = shallow(...args))

const assertIn = (node, selector, isPresent = true) => {
  const didFind = node.querySelector(selector) !== null
  didFind.should.equal(
    isPresent,
    `${didFind ? 'Found' : 'Did not find'} "${selector}" in the ${node}.`,
  )
}
const assertInBody = (...args) => assertIn(document.body, ...args)

describe('Popup', () => {
  beforeEach(() => {
    wrapper = undefined
  })

  afterEach(() => {
    if (wrapper && wrapper.unmount) wrapper.unmount()
  })

  common.isConformant(Popup, { rendersPortal: true })
  common.hasSubcomponents(Popup, [PopupHeader, PopupContent])
  common.hasValidTypings(Popup)

  // Heads up!
  //
  // Our commonTests do not currently handle wrapped components.
  // Nor do they handle components rendered to the body with Portal.
  // The Popup is wrapped in a Portal, so we manually test a few things here.

  it('renders a Portal', () => {
    wrapperShallow(<Popup />)
      .type()
      .should.equal(Portal)
  })

  it('renders to the document body', () => {
    wrapperMount(<Popup open />)
    assertInBody('.ui.popup.visible')
  })

  it('renders child text', () => {
    wrapperMount(<Popup open>child text</Popup>)

    document.querySelector('.ui.popup.visible').innerText.should.equal('child text')
  })

  it('renders child components', () => {
    const child = <div data-child />
    wrapperMount(<Popup open>{child}</Popup>)

    document
      .querySelector('.ui.popup.visible')
      .querySelector('[data-child]')
      .should.not.equal(null, 'Popup did not render the child component.')
  })

  it('should add className to the Popup wrapping node', () => {
    wrapperMount(<Popup className='some-class' open />)
    assertInBody('.ui.popup.visible.some-class')
  })

  describe('offset', () => {
    it('accepts an offset to the left', () => {
      wrapperMount(
        <Popup
          horizontalOffset={50}
          position='bottom right'
          content='foo'
          trigger={<button>foo</button>}
        />,
      )

      wrapper.find('button').simulate('click')
      assertInBody('.ui.popup.visible')
    })
    it('accepts an offset to the right', () => {
      wrapperMount(
        <Popup
          horizontalOffset={50}
          position='bottom left'
          content='foo'
          trigger={<button>foo</button>}
        />,
      )

      wrapper.find('button').simulate('click')
      assertInBody('.ui.popup.visible')
    })
    it('causes the style to be updated', () => {
      wrapperMount(
        <Popup
          horizontalOffset={50}
          position='bottom left'
          content='foo'
          trigger={<button>foo</button>}
        />,
      )

      wrapper.find('button').simulate('click')
      const element = document.querySelector('.popup.ui')
      element.style.should.have.property('left', '-50px')
      wrapper.setProps({ horizontalOffset: 60 })
      element.style.should.have.property('left', '-60px')
    })
  })

  describe('verticalOffset', () => {
    it('accepts a vertical offset to the top', () => {
      wrapperMount(
        <Popup
          verticalOffset={50}
          position='bottom right'
          content='foo'
          trigger={<button>foo</button>}
        />,
      )

      wrapper.find('button').simulate('click')
      assertInBody('.ui.popup.visible')
    })
    it('accepts a vertical offset to the bottom', () => {
      wrapperMount(
        <Popup
          verticalOffset={50}
          position='top left'
          content='foo'
          trigger={<button>foo</button>}
        />,
      )

      wrapper.find('button').simulate('click')
      assertInBody('.ui.popup.visible')
    })
    it('causes the style to be updated', () => {
      wrapperMount(
        <Popup
          verticalOffset={50}
          position='bottom right'
          content='foo'
          trigger={<button>foo</button>}
        />,
      )

      wrapper.find('button').simulate('click')
      const element = document.querySelector('.popup.ui')
      element.style.should.have.property('top', '50px')
      wrapper.setProps({ verticalOffset: 60 })
      element.style.should.have.property('top', '60px')
    })
  })

  describe('position', () => {
    POSITIONS.forEach((position) => {
      it(`"${position}" is always within the viewport when the trigger is clicked`, () => {
        wrapperMount(
          <Popup content='_' position={position} trigger={<button>foo</button>} on='click' />,
        )
        wrapper.find('button').simulate('click')

        const rect = document.querySelector('.popup.ui').getBoundingClientRect()
        const { top, right, bottom, left } = rect
        expect(top).to.be.at.least(0)
        expect(left).to.be.at.least(0)
        expect(bottom).to.be.at.most(document.documentElement.clientHeight)
        expect(right).to.be.at.most(document.documentElement.clientWidth)
      })
      it(`"${position}" is positioned properly when open property is set`, (done) => {
        wrapperMount(<Popup content='_' position={position} open trigger={<button>foo</button>} />)
        setTimeout(() => {
          const element = document.querySelector('.popup.ui')
          const { top, left, bottom, right } = element.style
          expect(element.style.position).to.equal('absolute')
          expect(top).to.not.equal('')
          expect(left).to.not.equal('')
          expect(bottom).to.not.equal('')
          expect(right).to.not.equal('')
          done()
        }, 1)
      })
      it(`"${position}" is the original if no horizontal position fits within the viewport`, () => {
        wrapperMount(
          <Popup
            content='_'
            position={position}
            trigger={<button>foo</button>}
            on='click'
            horizontalOffset={999}
          />,
        )
        wrapper.find('button').simulate('click')
        const selectedPosition = wrapper.state('position')

        expect(selectedPosition).to.equal(position)
      })

      it(`"${position}" is the original if no vertical position fits within the viewport`, () => {
        wrapperMount(
          <Popup
            content='_'
            position={position}
            trigger={<button>foo</button>}
            on='click'
            verticalOffset={3000}
          />,
        )
        wrapper.find('button').simulate('click')
        const selectedPosition = wrapper.state('position')

        expect(selectedPosition).to.equal(position)
      })
    })
  })

  describe('keepInViewPort', () => {
    it('will not alter the position and render outside the viewport if set to false', () => {
      wrapperMount(
        <Popup
          content='_'
          position='top center'
          trigger={<button>foo</button>}
          on='click'
          keepInViewPort={false}
        />,
      )
      wrapper.find('button').simulate('click')

      const rect = document.querySelector('.popup.ui').getBoundingClientRect()
      const { top } = rect

      const selectedPosition = wrapper.state('position')

      expect(selectedPosition).to.equal('top center')
      expect(top).to.be.below(0)
    })

    it('is enabled by default', () => {
      expect(Popup.defaultProps.keepInViewPort).to.equal(true)
    })

    it('alters the position when true and renders within the viewport', () => {
      wrapperMount(
        <Popup
          content='_'
          position='top center'
          trigger={<button>foo</button>}
          on='click'
          keepInViewPort
        />,
      )
      wrapper.find('button').simulate('click')

      const rect = document.querySelector('.popup.ui').getBoundingClientRect()
      const { top } = rect

      const selectedPosition = wrapper.state('position')

      expect(selectedPosition).to.not.equal('top center')
      expect(top).to.be.at.least(0)
    })
  })

  describe('hoverable', () => {
    it('can be set to stay visible while hovering the popup', () => {
      shallow(<Popup hoverable open />)
        .find('Portal')
        .should.have.prop('closeOnPortalMouseLeave', true)
    })
  })

  describe('hide on scroll', () => {
    it('hides on window scroll', () => {
      const trigger = <button>foo</button>
      wrapperMount(<Popup hideOnScroll content='foo' trigger={trigger} />)

      wrapper.find('button').simulate('click')
      assertInBody('.ui.popup.visible')

      domEvent.scroll(window)
      assertInBody('.ui.popup.visible', false)
    })

    it('is called with (e, props) when scroll', () => {
      const onClose = sandbox.spy()
      const trigger = <button>foo</button>

      wrapperMount(<Popup content='foo' hideOnScroll onClose={onClose} trigger={trigger} />)
        .find('button')
        .simulate('click')

      domEvent.scroll(window)
      onClose.should.have.been.calledOnce()
      onClose.should.have.been.calledWithMatch({}, { content: 'foo', onClose, trigger })
    })
  })

  describe('trigger', () => {
    it('it appears on click', () => {
      const trigger = <button>foo</button>
      wrapperMount(<Popup on='click' content='foo' header='bar' trigger={trigger} />)

      wrapper.find('button').simulate('click')
      assertInBody('.ui.popup.visible')
    })

    it('it appears on hover', (done) => {
      const trigger = <button>foo</button>
      wrapperMount(<Popup content='foo' trigger={trigger} mouseEnterDelay={0} />)

      wrapper.find('button').simulate('mouseenter')
      setTimeout(() => {
        assertInBody('.ui.popup.visible')
        done()
      }, 1)
    })

    it('it appears on focus', () => {
      const trigger = <input type='text' />
      wrapperMount(<Popup on='focus' content='foo' trigger={trigger} />)

      wrapper.find('input').simulate('focus')
      assertInBody('.ui.popup.visible')
    })

    it('it appears on multiple', (done) => {
      const trigger = <button>foo</button>
      const button = wrapperMount(
        <Popup on={['click', 'hover']} content='foo' header='bar' trigger={trigger} />,
      ).find('button')

      button.simulate('click')
      assertInBody('.ui.popup.visible')

      domEvent.click('body')

      button.simulate('mouseenter')
      setTimeout(() => {
        assertInBody('.ui.popup.visible')
        done()
      }, 51)
    })
  })

  describe('context', () => {
    // We're expecting to see this:
    //
    // |- context -----------------------------|
    // |             99px x 10px               |
    // |---------------------------------------|
    //                  ---^---
    //                 | popup |
    //                  -------

    it('aligns the popup to the context node', () => {
      const context = document.createElement('div')
      context.innerText = '.'
      context.style.marginTop = '400px'
      context.style.marginLeft = '400px'
      context.style.width = '99px'
      context.style.height = '10px'

      document.body.appendChild(context)
      const contextRect = context.getBoundingClientRect()

      wrapperMount(
        <Popup id='context-popup' context={context} content='.' position='bottom center' open />,
      )

      const popupRect = document.querySelector('#context-popup').getBoundingClientRect()

      document.body.removeChild(context)

      popupRect.top.should.equal(
        contextRect.bottom,
        "The popup's top should have been equal to the context's bottom.",
      )
    })

    it('aligns the popup to the context node even when there is a trigger', () => {
      const context = document.createElement('div')
      context.innerText = '.'
      context.style.marginTop = '400px'
      context.style.marginLeft = '400px'
      context.style.width = '99px'
      context.style.height = '10px'

      document.body.appendChild(context)
      const contextRect = context.getBoundingClientRect()

      wrapperMount(
        <Popup
          id='context-popup'
          trigger={<button />}
          context={context}
          content='.'
          position='bottom center'
          open
        />,
      )

      const popupRect = document.querySelector('#context-popup').getBoundingClientRect()

      document.body.removeChild(context)

      popupRect.top.should.equal(
        contextRect.bottom,
        "The popup's top should have been equal to the context's bottom.",
      )
    })
  })

  describe('open', () => {
    it('is not open by default', () => {
      wrapperMount(<Popup />)
      assertInBody('.ui.popup.visible', false)
    })

    it('is passed to Portal open', () => {
      shallow(<Popup open />)
        .find('Portal')
        .should.have.prop('open', true)

      shallow(<Popup open={false} />)
        .find('Portal')
        .should.have.prop('open', false)
    })

    it('does not show the popup when false', () => {
      wrapperMount(<Popup open={false} />)
      assertInBody('.ui.popup.visible', false)
    })

    it('shows the popup on changing from false to true', () => {
      wrapperMount(<Popup open={false} />)
      assertInBody('.ui.popup.visible', false)

      wrapper.setProps({ open: true })

      assertInBody('.ui.popup.visible')
    })

    it('hides the popup on changing from true to false', () => {
      wrapperMount(<Popup open />)
      assertInBody('.ui.popup.visible')

      wrapper.setProps({ open: false })

      assertInBody('.ui.popup.visible', false)
    })
  })

  describe('disabled', () => {
    it('is not disabled by default', () => {
      shallow(<Popup />)
        .find('Portal')
        .should.exist()
    })

    it('does not render Portal if disabled', () => {
      shallow(<Popup disabled />)
        .find('Portal')
        .should.not.exist()
    })

    it('does not render Portal even with open prop', () => {
      shallow(<Popup open disabled />)
        .find('Portal')
        .should.not.exist()
    })
  })

  describe('basic', () => {
    it('adds basic to the popup className', () => {
      wrapperMount(<Popup basic open />)
      assertInBody('.ui.basic.popup.visible')
    })
  })

  describe('flowing', () => {
    it('adds flowing to the popup className', () => {
      wrapperMount(<Popup flowing open />)
      assertInBody('.ui.flowing.popup.visible')
    })
  })

  describe('inverted', () => {
    it('adds inverted to the popup className', () => {
      wrapperMount(<Popup inverted open />)
      assertInBody('.ui.inverted.popup.visible')
    })
  })

  describe('wide', () => {
    it('adds wide to the popup className', () => {
      wrapperMount(<Popup wide open />)
      assertInBody('.ui.wide.popup.visible')
    })
  })

  describe('very wide', () => {
    it('adds very wide to the popup className', () => {
      wrapperMount(<Popup wide='very' open />)
      assertInBody('.ui.very.wide.popup.visible')
    })
  })

  describe('size', () => {
    const sizes = _.without(SUI.SIZES, 'medium', 'big', 'massive')

    sizes.forEach((size) => {
      it(`adds the ${size} to the popup className`, () => {
        wrapperMount(<Popup size={size} open />)
        assertInBody(`.ui.${size}.popup`)
      })
    })
  })

  describe('onClose', () => {
    let spy

    beforeEach(() => {
      spy = sandbox.spy()
      wrapperMount(<Popup onClose={spy} defaultOpen />)
    })

    it('is not called on click inside of the popup', () => {
      domEvent.click(document.querySelector('.ui.popup'))
      spy.should.not.have.been.calledOnce()
    })

    it('is called on body click', () => {
      domEvent.click('body')
      spy.should.have.been.calledOnce()
    })

    it('is called when pressing escape', () => {
      domEvent.keyDown(document, { key: 'Escape' })
      spy.should.have.been.calledOnce()
    })

    it('is not called when the open prop changes to false', () => {
      wrapper.setProps({ open: false })
      spy.should.not.have.been.called()
    })
  })
})
