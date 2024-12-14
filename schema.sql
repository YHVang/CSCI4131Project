
-----------------------------------

drop table Description;
drop table Todos;
drop table FinishedTodos;

create table Todos(
    id int not null auto_increment,
    chore varchar(50) not null,
    primary key (id)
);

create table Description(
    description_text text not null,
    description_id int,
    foreign key (description_id) REFERENCES Todos(id)
);

create table FinishedTodos(
    id int not null auto_increment,
    chore varchar(50) not null,
    primary key (id)
);

INSERT INTO Todos(chore) VALUES("Clean the garage");
INSERT INTO Todos(chore) VALUES("Pick up groceries");
INSERT INTO Todos(chore) VALUES("Do the laundry");

INSERT INTO Description VALUES("Remove all useless junk and reorganize storage boxes.", 1);
INSERT INTO Description VALUES("Pick up meat, vegies, and water",2);
INSERT INTO Description VALUES("Seporate the whites and colors",3);


SELECT * from Todos;
SELECT * from Description;