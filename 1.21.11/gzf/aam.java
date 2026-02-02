import aam.1;
import aam.10;
import aam.11;
import aam.12;
import aam.13;
import aam.14;
import aam.15;
import aam.16;
import aam.17;
import aam.18;
import aam.19;
import aam.2;
import aam.20;
import aam.21;
import aam.22;
import aam.23;
import aam.24;
import aam.25;
import aam.26;
import aam.27;
import aam.28;
import aam.3;
import aam.30;
import aam.31;
import aam.32;
import aam.33;
import aam.34;
import aam.35;
import aam.4;
import aam.5;
import aam.6;
import aam.7;
import aam.8;
import aam.9;
import com.google.gson.JsonElement;
import com.mojang.authlib.GameProfile;
import com.mojang.authlib.properties.PropertyMap;
import com.mojang.datafixers.util.Either;
import com.mojang.serialization.Codec;
import com.mojang.serialization.DynamicOps;
import io.netty.buffer.ByteBuf;
import io.netty.handler.codec.DecoderException;
import io.netty.handler.codec.EncoderException;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.OptionalInt;
import java.util.function.BiFunction;
import java.util.function.Function;
import java.util.function.IntFunction;
import java.util.function.Supplier;
import java.util.function.ToIntFunction;
import org.joml.Quaternionfc;
import org.joml.Vector3fc;

public interface aam {
   int a = 65536;
   aao<ByteBuf, Boolean> b = new 1();
   aao<ByteBuf, Byte> c = new 12();
   aao<ByteBuf, Float> d = c.a(bgj::a, bgj::e);
   aao<ByteBuf, Short> e = new 23();
   aao<ByteBuf, Integer> f = new 30();
   aao<ByteBuf, Integer> g = new 31();
   aao<ByteBuf, Integer> h = new 32();
   aao<ByteBuf, OptionalInt> i = h.a(($$0) -> {
      return $$0 == 0 ? OptionalInt.empty() : OptionalInt.of($$0 - 1);
   }, ($$0) -> {
      return $$0.isPresent() ? $$0.getAsInt() + 1 : 0;
   });
   aao<ByteBuf, Long> j = new 33();
   aao<ByteBuf, Long> k = new 34();
   aao<ByteBuf, Float> l = new 35();
   aao<ByteBuf, Double> m = new 2();
   aao<ByteBuf, byte[]> n = new 4();
   aao<ByteBuf, long[]> o = new 5();
   aao<ByteBuf, String> p = b(32767);
   aao<ByteBuf, vz> q = b(vi::a);
   aao<ByteBuf, vz> r = b(vi::c);
   aao<ByteBuf, uz> s = c(vi::a);
   aao<ByteBuf, uz> t = c(vi::c);
   aao<ByteBuf, Optional<uz>> u = new 11();
   aao<ByteBuf, Vector3fc> v = new 13();
   aao<ByteBuf, Quaternionfc> w = new 14();
   aao<ByteBuf, Integer> x = new 15();
   aao<ByteBuf, PropertyMap> y = new 26();
   aao<ByteBuf, String> z = b(16);
   aao<ByteBuf, GameProfile> A = aao.a(jx.g, GameProfile::id, z, GameProfile::name, y, GameProfile::properties, GameProfile::new);
   aao<ByteBuf, Integer> B = new 27();

   static aao<ByteBuf, byte[]> a(int $$0) {
      return new 3($$0);
   }

   static aao<ByteBuf, String> b(int $$0) {
      return new 6($$0);
   }

   static aao<ByteBuf, Optional<vz>> a(Supplier<vi> $$0) {
      return new 7($$0);
   }

   static aao<ByteBuf, vz> b(Supplier<vi> $$0) {
      return new 8($$0);
   }

   static aao<ByteBuf, uz> c(Supplier<vi> $$0) {
      return b($$0).a(($$0x) -> {
         if ($$0x instanceof uz) {
            uz $$1 = (uz)$$0x;
            return $$1;
         } else {
            throw new DecoderException("Not a compound tag: " + String.valueOf($$0x));
         }
      }, ($$0x) -> {
         return $$0x;
      });
   }

   static <T> aao<ByteBuf, T> a(Codec<T> $$0) {
      return a($$0, vi::c);
   }

   static <T> aao<ByteBuf, T> b(Codec<T> $$0) {
      return a($$0, vi::a);
   }

   static <T, B extends ByteBuf, V> aao.a<B, T, V> a(DynamicOps<T> $$0, Codec<V> $$1) {
      return ($$2) -> {
         return new 9($$2, $$1, $$0);
      };
   }

   static <T> aao<ByteBuf, T> a(Codec<T> $$0, Supplier<vi> $$1) {
      return b($$1).a(a((DynamicOps)vn.a, (Codec)$$0));
   }

   static <T> aao<xq, T> c(Codec<T> $$0) {
      return b($$0, vi::c);
   }

   static <T> aao<xq, T> d(Codec<T> $$0) {
      return b($$0, vi::a);
   }

   static <T> aao<xq, T> b(Codec<T> $$0, Supplier<vi> $$1) {
      aao<ByteBuf, vz> $$2 = b($$1);
      return new 10($$2, $$0);
   }

   static <B extends ByteBuf, V> aao<B, Optional<V>> a(aao<? super B, V> $$0) {
      return new 16($$0);
   }

   static int a(ByteBuf $$0, int $$1) {
      int $$2 = xy.a($$0);
      if ($$2 > $$1) {
         throw new DecoderException($$2 + " elements exceeded max size of: " + $$1);
      } else {
         return $$2;
      }
   }

   static void a(ByteBuf $$0, int $$1, int $$2) {
      if ($$1 > $$2) {
         throw new EncoderException($$1 + " elements exceeded max size of: " + $$2);
      } else {
         xy.a($$0, $$1);
      }
   }

   static <B extends ByteBuf, V, C extends Collection<V>> aao<B, C> a(IntFunction<C> $$0, aao<? super B, V> $$1) {
      return a($$0, $$1, Integer.MAX_VALUE);
   }

   static <B extends ByteBuf, V, C extends Collection<V>> aao<B, C> a(IntFunction<C> $$0, aao<? super B, V> $$1, int $$2) {
      return new 17($$2, $$0, $$1);
   }

   static <B extends ByteBuf, V, C extends Collection<V>> aao.a<B, V, C> a(IntFunction<C> $$0) {
      return ($$1) -> {
         return a($$0, $$1);
      };
   }

   static <B extends ByteBuf, V> aao.a<B, V, List<V>> a() {
      return ($$0) -> {
         return a(ArrayList::new, $$0);
      };
   }

   static <B extends ByteBuf, V> aao.a<B, V, List<V>> c(int $$0) {
      return ($$1) -> {
         return a(ArrayList::new, $$1, $$0);
      };
   }

   static <B extends ByteBuf, K, V, M extends Map<K, V>> aao<B, M> a(IntFunction<? extends M> $$0, aao<? super B, K> $$1, aao<? super B, V> $$2) {
      return a($$0, $$1, $$2, Integer.MAX_VALUE);
   }

   static <B extends ByteBuf, K, V, M extends Map<K, V>> aao<B, M> a(IntFunction<? extends M> $$0, aao<? super B, K> $$1, aao<? super B, V> $$2, int $$3) {
      return new 18($$3, $$1, $$2, $$0);
   }

   static <B extends ByteBuf, L, R> aao<B, Either<L, R>> a(aao<? super B, L> $$0, aao<? super B, R> $$1) {
      return new 19($$0, $$1);
   }

   static <B extends ByteBuf, V> aao.a<B, V, V> a(int $$0, BiFunction<B, ByteBuf, B> $$1) {
      return ($$2) -> {
         return new 20($$0, $$1, $$2);
      };
   }

   static <V> aao.a<ByteBuf, V, V> d(int $$0) {
      return a($$0, ($$0x, $$1) -> {
         return $$1;
      });
   }

   static <V> aao.a<xq, V, V> e(int $$0) {
      return a($$0, ($$0x, $$1) -> {
         return new xq($$1, $$0x.G());
      });
   }

   static <T> aao<ByteBuf, T> a(IntFunction<T> $$0, ToIntFunction<T> $$1) {
      return new 21($$0, $$1);
   }

   static <T> aao<ByteBuf, T> a(ji<T> $$0) {
      Objects.requireNonNull($$0);
      IntFunction var10000 = $$0::b;
      Objects.requireNonNull($$0);
      return a(var10000, $$0::c);
   }

   private static <T, R> aao<xq, R> a(amt<? extends jq<T>> $$0, Function<jq<T>, ji<R>> $$1) {
      return new 22($$1, $$0);
   }

   static <T> aao<xq, T> a(amt<? extends jq<T>> $$0) {
      return a($$0, ($$0x) -> {
         return $$0x;
      });
   }

   static <T> aao<xq, jd<T>> b(amt<? extends jq<T>> $$0) {
      return a($$0, jq::t);
   }

   static <T> aao<xq, jd<T>> a(amt<? extends jq<T>> $$0, aao<? super xq, T> $$1) {
      return new 24($$0, $$1);
   }

   static <T> aao<xq, jh<T>> c(amt<? extends jq<T>> $$0) {
      return new 25($$0);
   }

   static aao<ByteBuf, JsonElement> f(int $$0) {
      return new 28($$0);
   }
}
