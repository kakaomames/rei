import io.netty.buffer.ByteBuf;

public interface aay<T extends xk> {
   aba<? extends aay<T>> a();

   void a(T var1);

   default boolean c() {
      return false;
   }

   default boolean d() {
      return false;
   }

   static <B extends ByteBuf, T extends aay<?>> aao<B, T> a(aar<B, T> $$0, aap<B, T> $$1) {
      return aao.a($$0, $$1);
   }
}
