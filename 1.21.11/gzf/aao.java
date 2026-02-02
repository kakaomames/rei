import aao.1;
import aao.10;
import aao.11;
import aao.12;
import aao.13;
import aao.14;
import aao.15;
import aao.16;
import aao.17;
import aao.18;
import aao.19;
import aao.2;
import aao.3;
import aao.4;
import aao.5;
import aao.6;
import aao.7;
import aao.8;
import aao.9;
import com.mojang.datafixers.util.Function10;
import com.mojang.datafixers.util.Function11;
import com.mojang.datafixers.util.Function12;
import com.mojang.datafixers.util.Function3;
import com.mojang.datafixers.util.Function4;
import com.mojang.datafixers.util.Function5;
import com.mojang.datafixers.util.Function6;
import com.mojang.datafixers.util.Function7;
import com.mojang.datafixers.util.Function8;
import com.mojang.datafixers.util.Function9;
import io.netty.buffer.ByteBuf;
import java.util.function.BiFunction;
import java.util.function.Function;
import java.util.function.UnaryOperator;

public interface aao<B, V> extends aap<B, V>, aaq<B, V> {
   static <B, V> aao<B, V> a(aaq<B, V> $$0, aap<B, V> $$1) {
      return new 1($$1, $$0);
   }

   static <B, V> aao<B, V> a(aar<B, V> $$0, aap<B, V> $$1) {
      return new 12($$1, $$0);
   }

   static <B, V> aao<B, V> a(V $$0) {
      return new 13($$0);
   }

   default <O> aao<B, O> a(aao.a<B, V, O> $$0) {
      return $$0.apply(this);
   }

   default <O> aao<B, O> a(Function<? super V, ? extends O> $$0, Function<? super O, ? extends V> $$1) {
      return new 14(this, $$0, $$1);
   }

   default <O extends ByteBuf> aao<O, V> b(Function<O, ? extends B> $$0) {
      return new 15(this, $$0);
   }

   default <U> aao<B, U> b(Function<? super U, ? extends V> $$0, Function<? super V, ? extends aao<? super B, ? extends U>> $$1) {
      return new 16(this, $$1, $$0);
   }

   static <B, C, T1> aao<B, C> a(aao<? super B, T1> $$0, Function<C, T1> $$1, Function<T1, C> $$2) {
      return new 17($$0, $$2, $$1);
   }

   static <B, C, T1, T2> aao<B, C> a(aao<? super B, T1> $$0, Function<C, T1> $$1, aao<? super B, T2> $$2, Function<C, T2> $$3, BiFunction<T1, T2, C> $$4) {
      return new 18($$0, $$2, $$4, $$1, $$3);
   }

   static <B, C, T1, T2, T3> aao<B, C> a(aao<? super B, T1> $$0, Function<C, T1> $$1, aao<? super B, T2> $$2, Function<C, T2> $$3, aao<? super B, T3> $$4, Function<C, T3> $$5, Function3<T1, T2, T3, C> $$6) {
      return new 19($$0, $$2, $$4, $$6, $$1, $$3, $$5);
   }

   static <B, C, T1, T2, T3, T4> aao<B, C> a(aao<? super B, T1> $$0, Function<C, T1> $$1, aao<? super B, T2> $$2, Function<C, T2> $$3, aao<? super B, T3> $$4, Function<C, T3> $$5, aao<? super B, T4> $$6, Function<C, T4> $$7, Function4<T1, T2, T3, T4, C> $$8) {
      return new 2($$0, $$2, $$4, $$6, $$8, $$1, $$3, $$5, $$7);
   }

   static <B, C, T1, T2, T3, T4, T5> aao<B, C> a(aao<? super B, T1> $$0, Function<C, T1> $$1, aao<? super B, T2> $$2, Function<C, T2> $$3, aao<? super B, T3> $$4, Function<C, T3> $$5, aao<? super B, T4> $$6, Function<C, T4> $$7, aao<? super B, T5> $$8, Function<C, T5> $$9, Function5<T1, T2, T3, T4, T5, C> $$10) {
      return new 3($$0, $$2, $$4, $$6, $$8, $$10, $$1, $$3, $$5, $$7, $$9);
   }

   static <B, C, T1, T2, T3, T4, T5, T6> aao<B, C> a(aao<? super B, T1> $$0, Function<C, T1> $$1, aao<? super B, T2> $$2, Function<C, T2> $$3, aao<? super B, T3> $$4, Function<C, T3> $$5, aao<? super B, T4> $$6, Function<C, T4> $$7, aao<? super B, T5> $$8, Function<C, T5> $$9, aao<? super B, T6> $$10, Function<C, T6> $$11, Function6<T1, T2, T3, T4, T5, T6, C> $$12) {
      return new 4($$0, $$2, $$4, $$6, $$8, $$10, $$12, $$1, $$3, $$5, $$7, $$9, $$11);
   }

   static <B, C, T1, T2, T3, T4, T5, T6, T7> aao<B, C> a(aao<? super B, T1> $$0, Function<C, T1> $$1, aao<? super B, T2> $$2, Function<C, T2> $$3, aao<? super B, T3> $$4, Function<C, T3> $$5, aao<? super B, T4> $$6, Function<C, T4> $$7, aao<? super B, T5> $$8, Function<C, T5> $$9, aao<? super B, T6> $$10, Function<C, T6> $$11, aao<? super B, T7> $$12, Function<C, T7> $$13, Function7<T1, T2, T3, T4, T5, T6, T7, C> $$14) {
      return new 5($$0, $$2, $$4, $$6, $$8, $$10, $$12, $$14, $$1, $$3, $$5, $$7, $$9, $$11, $$13);
   }

   static <B, C, T1, T2, T3, T4, T5, T6, T7, T8> aao<B, C> a(aao<? super B, T1> $$0, Function<C, T1> $$1, aao<? super B, T2> $$2, Function<C, T2> $$3, aao<? super B, T3> $$4, Function<C, T3> $$5, aao<? super B, T4> $$6, Function<C, T4> $$7, aao<? super B, T5> $$8, Function<C, T5> $$9, aao<? super B, T6> $$10, Function<C, T6> $$11, aao<? super B, T7> $$12, Function<C, T7> $$13, aao<? super B, T8> $$14, Function<C, T8> $$15, Function8<T1, T2, T3, T4, T5, T6, T7, T8, C> $$16) {
      return new 6($$0, $$2, $$4, $$6, $$8, $$10, $$12, $$14, $$16, $$1, $$3, $$5, $$7, $$9, $$11, $$13, $$15);
   }

   static <B, C, T1, T2, T3, T4, T5, T6, T7, T8, T9> aao<B, C> a(aao<? super B, T1> $$0, Function<C, T1> $$1, aao<? super B, T2> $$2, Function<C, T2> $$3, aao<? super B, T3> $$4, Function<C, T3> $$5, aao<? super B, T4> $$6, Function<C, T4> $$7, aao<? super B, T5> $$8, Function<C, T5> $$9, aao<? super B, T6> $$10, Function<C, T6> $$11, aao<? super B, T7> $$12, Function<C, T7> $$13, aao<? super B, T8> $$14, Function<C, T8> $$15, aao<? super B, T9> $$16, Function<C, T9> $$17, Function9<T1, T2, T3, T4, T5, T6, T7, T8, T9, C> $$18) {
      return new 7($$0, $$2, $$4, $$6, $$8, $$10, $$12, $$14, $$16, $$18, $$1, $$3, $$5, $$7, $$9, $$11, $$13, $$15, $$17);
   }

   static <B, C, T1, T2, T3, T4, T5, T6, T7, T8, T9, T10> aao<B, C> a(aao<? super B, T1> $$0, Function<C, T1> $$1, aao<? super B, T2> $$2, Function<C, T2> $$3, aao<? super B, T3> $$4, Function<C, T3> $$5, aao<? super B, T4> $$6, Function<C, T4> $$7, aao<? super B, T5> $$8, Function<C, T5> $$9, aao<? super B, T6> $$10, Function<C, T6> $$11, aao<? super B, T7> $$12, Function<C, T7> $$13, aao<? super B, T8> $$14, Function<C, T8> $$15, aao<? super B, T9> $$16, Function<C, T9> $$17, aao<? super B, T10> $$18, Function<C, T10> $$19, Function10<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, C> $$20) {
      return new 8($$0, $$2, $$4, $$6, $$8, $$10, $$12, $$14, $$16, $$18, $$20, $$1, $$3, $$5, $$7, $$9, $$11, $$13, $$15, $$17, $$19);
   }

   static <B, C, T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11> aao<B, C> a(aao<? super B, T1> $$0, Function<C, T1> $$1, aao<? super B, T2> $$2, Function<C, T2> $$3, aao<? super B, T3> $$4, Function<C, T3> $$5, aao<? super B, T4> $$6, Function<C, T4> $$7, aao<? super B, T5> $$8, Function<C, T5> $$9, aao<? super B, T6> $$10, Function<C, T6> $$11, aao<? super B, T7> $$12, Function<C, T7> $$13, aao<? super B, T8> $$14, Function<C, T8> $$15, aao<? super B, T9> $$16, Function<C, T9> $$17, aao<? super B, T10> $$18, Function<C, T10> $$19, aao<? super B, T11> $$20, Function<C, T11> $$21, Function11<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, C> $$22) {
      return new 9($$0, $$2, $$4, $$6, $$8, $$10, $$12, $$14, $$16, $$18, $$20, $$22, $$1, $$3, $$5, $$7, $$9, $$11, $$13, $$15, $$17, $$19, $$21);
   }

   static <B, C, T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12> aao<B, C> a(aao<? super B, T1> $$0, Function<C, T1> $$1, aao<? super B, T2> $$2, Function<C, T2> $$3, aao<? super B, T3> $$4, Function<C, T3> $$5, aao<? super B, T4> $$6, Function<C, T4> $$7, aao<? super B, T5> $$8, Function<C, T5> $$9, aao<? super B, T6> $$10, Function<C, T6> $$11, aao<? super B, T7> $$12, Function<C, T7> $$13, aao<? super B, T8> $$14, Function<C, T8> $$15, aao<? super B, T9> $$16, Function<C, T9> $$17, aao<? super B, T10> $$18, Function<C, T10> $$19, aao<? super B, T11> $$20, Function<C, T11> $$21, aao<? super B, T12> $$22, Function<C, T12> $$23, Function12<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, C> $$24) {
      return new 10($$0, $$2, $$4, $$6, $$8, $$10, $$12, $$14, $$16, $$18, $$20, $$22, $$24, $$1, $$3, $$5, $$7, $$9, $$11, $$13, $$15, $$17, $$19, $$21, $$23);
   }

   static <B, T> aao<B, T> a(UnaryOperator<aao<B, T>> $$0) {
      return new 11($$0);
   }

   default <S extends B> aao<S, V> a() {
      return this;
   }

   @FunctionalInterface
   public interface a<B, S, T> {
      aao<B, T> apply(aao<B, S> var1);
   }
}
