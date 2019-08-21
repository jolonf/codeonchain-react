import './Modal.css';

import React, { ReactNode } from "react";

interface ModalProps {
  onClose: Function;
  title: string;
  children?: ReactNode;
}

class Modal extends React.Component<ModalProps> {

  render() {
    return (
      <div id="overlay" onClick={() => this.props.onClose()}>
        <div id="dialog" onClick={(e) => {e.stopPropagation()}}>
          <h2 style={{marginTop: 0}}>{this.props.title}</h2>
          <hr />
          {this.props.children}
        </div>
      </div>
    );
  }
}

export default Modal;