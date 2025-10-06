import ReactDOM from 'react-dom/client';

const myFirstElement = "Hello ";
class Car {
    constructor(name) {
      this.brand = name;
    }
    
    present() {
      return 'I have a ' + this.brand;
    }
  }

  class Model extends Car {
    constructor(name, mod) {
      super(name);
      this.model = mod;
    }  
    show() {
        return this.present() + ', it is a ' + this.model
    }
  }
  const mycar = new Model("Ford", "Mustang");
  let a = myFirstElement+mycar.show();

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(a);
